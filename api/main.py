"""HumQadam backend — FastAPI.

Endpoints:
  GET  /health  → liveness + config check
  POST /chat    → grounded, non-partisan civic answer via OpenRouter (RAG context)
  POST /tts     → free Urdu/regional speech via edge-tts (no API key)

Only an OpenRouter API key is required (for the LLM). TTS is free via edge-tts.
"""
import os
import re
import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import edge_tts

from kb import KnowledgeBase

load_dotenv()

KB = KnowledgeBase()

# ---- LLM fallback chain (100% free) --------------------------------------
# Two OpenAI-compatible providers. We try models in order; if one is
# rate-limited (429) / unavailable (5xx) / returns empty, we fall through to
# the next. Chosen by head-to-head Urdu/Punjabi benchmark (see eval_models.py):
#   1. gemini-2.5-flash-lite : fast, dedicated 15 RPM free quota (most reliable)
#   2. gemma-4-31b-it:free   : best quality + real Punjabi (OpenRouter free)
#   3. gemini-2.5-flash      : higher-quality backstop
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_BASE_URL = os.getenv(
    "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/"
)
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

CLIENTS = {}
# max_retries=0 so a rate-limited model fails fast and we fall through
# immediately (the SDK otherwise retries 429s with backoff, adding seconds).
if GEMINI_API_KEY:
    CLIENTS["gemini"] = OpenAI(base_url=GEMINI_BASE_URL, api_key=GEMINI_API_KEY, max_retries=0, timeout=20)
if OPENROUTER_API_KEY:
    CLIENTS["or"] = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY, max_retries=0, timeout=20)

# Override via env LLM_CHAIN="provider:model,provider:model" (provider = gemini|or)
DEFAULT_CHAIN = (
    "gemini:gemini-2.5-flash-lite,"
    "or:google/gemma-4-31b-it:free,"
    "gemini:gemini-2.5-flash"
)
MODEL_CHAIN = [
    (p.strip(), m.strip())
    for p, m in (pair.split(":", 1) for pair in os.getenv("LLM_CHAIN", DEFAULT_CHAIN).split(","))
    if p.strip() in CLIENTS
]
HAS_KEY = bool(MODEL_CHAIN)

# language code -> (human name for the LLM, edge-tts voice)
LANGUAGES = {
    "ur": ("Urdu", "ur-PK-UzmaNeural"),
    "pa": ("Punjabi (Shahmukhi)", "ur-PK-UzmaNeural"),   # edge-tts lacks pa-PK; Urdu voice is close
    "ps": ("Pashto", "ur-PK-UzmaNeural"),
    "skr": ("Saraiki", "ur-PK-UzmaNeural"),
    "en": ("English", "en-US-AriaNeural"),
}
DEFAULT_VOICE = "ur-PK-UzmaNeural"

SYSTEM_PROMPT = """You are HumQadam (ہم قدم), a warm, patient, female voice civic assistant for Pakistan.
You help citizens — especially low-literacy women, rural and elderly people — understand how to get a CNIC, register to vote, check their registration, find their polling station, and cast their vote.

STRICT RULES:
1. Answer ONLY using the VERIFIED INFORMATION provided below. Never invent facts, fees, phone numbers, documents, or steps. If the answer is not in the verified information, say you are not sure and tell them to call NADRA 1777 or the ECP, then stop.
2. You are STRICTLY NON-PARTISAN. Never recommend or hint at any party, candidate, or political opinion. If asked who to vote for, gently explain the choice is theirs and private, and offer to explain the voting process instead.
3. Reply in {language} ONLY. Use simple, everyday spoken words — imagine speaking out loud to someone who cannot read. Short sentences.
4. Keep replies SHORT: 2–4 sentences. This is a voice conversation, not an essay. If there are steps, give a few clear steps, and offer to repeat or continue.
5. Be encouraging and respectful. Reassure women that they can do this themselves and do not need anyone's permission to get a CNIC or to vote.
6. At the VERY END of every reply, on a new line, output the ids of the verified-information items you used, exactly in this format and nothing after it:
[[SOURCES: id1, id2]]
If you used none (e.g. a greeting or a refusal), output [[SOURCES: ]].

VERIFIED INFORMATION:
{context}
"""

app = FastAPI(title="HumQadam API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon demo; tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    language: str = "ur"
    history: list[dict] = []  # [{role: 'user'|'assistant', content: str}]


class ChatResponse(BaseModel):
    reply: str
    sources: list[dict]
    language: str


class TTSRequest(BaseModel):
    text: str
    language: str = "ur"


_SOURCES_RE = re.compile(r"\[\[\s*SOURCES\s*:\s*(.*?)\s*\]\]", re.IGNORECASE | re.DOTALL)


def _split_reply_and_sources(raw: str):
    """Strip the [[SOURCES: ...]] tail from the spoken reply and return ids."""
    ids: list[str] = []
    m = _SOURCES_RE.search(raw)
    if m:
        ids = [s.strip() for s in m.group(1).split(",") if s.strip()]
    reply = _SOURCES_RE.sub("", raw).strip()
    return reply, ids


@app.get("/health")
def health():
    return {
        "status": "ok",
        "chain": [f"{p}:{m}" for p, m in MODEL_CHAIN],
        "has_api_key": HAS_KEY,
        "kb_entries": len(KB.entries),
    }


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not HAS_KEY:
        raise HTTPException(
            500,
            "No usable LLM in api/.env (need GEMINI_API_KEY and/or OPENROUTER_API_KEY)",
        )

    lang_name, _ = LANGUAGES.get(req.language, LANGUAGES["ur"])
    system = SYSTEM_PROMPT.format(language=lang_name, context=KB.context_block())

    messages = [{"role": "system", "content": system}]
    # keep a short window of recent turns for context
    for turn in req.history[-6:]:
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": req.message})

    # Try each model in the chain; fall through on rate-limit/unavailable/empty.
    last_err = None
    for provider, model in MODEL_CHAIN:
        client = CLIENTS[provider]
        kwargs = dict(model=model, messages=messages, temperature=0.3, max_tokens=1024)
        if provider == "or":
            kwargs["extra_headers"] = {"HTTP-Referer": "https://humqadam.local", "X-Title": "HumQadam"}
        try:
            completion = client.chat.completions.create(**kwargs)
            raw = (completion.choices[0].message.content or "").strip()
            if not raw:
                last_err = f"{model}: empty response"
                continue
            reply, ids = _split_reply_and_sources(raw)
            if not reply:
                last_err = f"{model}: no reply text"
                continue
            return ChatResponse(reply=reply, sources=KB.resolve(ids), language=req.language)
        except Exception as e:
            last_err = f"{model}: {e}"
            continue

    raise HTTPException(502, f"All models in the chain failed. Last error: {last_err}")


@app.post("/tts")
async def tts(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(400, "text is empty")
    _, voice = LANGUAGES.get(req.language, (None, DEFAULT_VOICE))

    async def synth() -> bytes:
        communicate = edge_tts.Communicate(req.text, voice)
        buf = bytearray()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.extend(chunk["data"])
        return bytes(buf)

    try:
        audio = await synth()
    except Exception as e:
        raise HTTPException(502, f"TTS failed: {e}")
    if not audio:
        raise HTTPException(502, "TTS produced no audio")
    return Response(content=audio, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
