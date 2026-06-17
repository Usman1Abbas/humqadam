# HumQadam — Technical Cheat-Sheet (Q&A glance card)

**One-liner:** Two services — a **Next.js** frontend (voice in/out) and a **FastAPI** backend that
**grounds every answer in a verified knowledge base (RAG)**, calls an LLM via a **free fallback
chain**, and returns a **cited** answer. The AI never answers from memory — only from verified sources.

---

## Request lifecycle (memorize this)
1. **STT** — browser **Web Speech API** transcribes spoken Urdu/Punjabi/Pashto (on-device, no key).
2. **→ `/chat`** — text + language + recent history sent to the backend.
3. **RAG** — backend injects the **entire verified KB** + the question into the prompt.
4. **LLM chain** — tries Gemini Flash-Lite → Gemma-4-31B (free) → Gemini Flash; fails over in <1s.
5. **Citations** — model emits `[[SOURCES: id]]`; backend strips it from the reply and maps IDs → source cards.
6. **TTS** — reply → **edge-tts** (`ur-PK-UzmaNeural`); falls back to browser voice. Audio + transcript + cards render.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind (RTL, Nastaliq font) — Vercel
- **Backend:** Python, FastAPI, Uvicorn, Pydantic — Render
- **AI:** Gemini 2.5 Flash-Lite / Flash + Gemma-4-31B (via OpenAI-compatible API); RAG grounding
- **Speech:** Web Speech API (STT) · edge-tts (TTS) + browser fallback
- **Endpoints:** `GET /health` · `POST /chat` · `POST /tts`

## Why these choices (defense lines)
- **RAG, not fine-tuning** → no training data; factual, citable, instantly updatable. Civic info must be correct.
- **Full-KB injection, not a vector DB** → KB is tiny (12 entries) → zero retrieval latency + cross-lingual matching (Urdu Q ↔ English source). Vector search is the scale path.
- **`[[SOURCES]]` tag** → reliable citations; model declares used entries; tag stripped from spoken reply.
- **Fallback chain (`max_retries=0`)** → free tiers 429; chaining independent free models = resilience at zero cost.
- **ASR→LLM pipeline, not end-to-end speech model** → benchmarks show it's better on low-resource Indic languages.
- **Model picked by benchmark** (`eval_models.py`), not by guesswork.

## Rapid-fire answers
| Question | Answer |
|---|---|
| Stop hallucinations? | Prompt forces answers only from the KB + forced citations; if unsure it declines → NADRA 1777. |
| Vector DB / embeddings? | None yet by design — small KB injected whole; semantic retrieval is the scale path. |
| Latency? | ~2s on primary model; ~6s if it falls to a slower free backup. |
| Non-partisan guarantee? | Hard system-prompt rule + 15 tests incl. a jailbreak it resists. |
| Privacy? | No PII stored; conversations ephemeral; keys are server-side env vars, never in the repo. |
| Why Chrome only? | STT uses Web Speech API (Chrome/Edge). Text input works everywhere; server-side Whisper is the upgrade. |
| Reach offline women? | It's telephony-ready (IVR/WhatsApp voice roadmap); awareness via NADRA vans, Lady Health Workers, NGOs. |
| What did you build vs the AI? | RAG grounding, verified KB, citation system, guardrails, model benchmark, voice pipeline, UI, fallback chain. |

## Known limits (be honest)
- STT is Chrome/Edge-only (text fallback everywhere).
- edge-tts is blocked on cloud IPs → hosted link uses browser voice.
- Free-tier quotas can rate-limit under heavy concurrent load (chain mitigates).
- No live user-pilot metrics yet (next step).

**Repo:** github.com/Usman1Abbas/humqadam · **Live:** humqadam.vercel.app
