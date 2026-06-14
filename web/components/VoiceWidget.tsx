"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendChat, fetchTTS, type ChatTurn, type Source } from "@/lib/api";

type Lang = { code: string; label: string; native: string; srLang: string; rtl: boolean };

const LANGS: Lang[] = [
  { code: "ur", label: "Urdu", native: "اردو", srLang: "ur-PK", rtl: true },
  { code: "pa", label: "Punjabi", native: "پنجابی", srLang: "pa-IN", rtl: true },
  { code: "ps", label: "Pashto", native: "پښتو", srLang: "ps-AF", rtl: true },
  { code: "en", label: "English", native: "English", srLang: "en-US", rtl: false },
];

// UI strings the user might actually need to see (kept tiny — this is a voice app)
const UI: Record<string, { tap: string; listening: string; thinking: string; speaking: string; greet: string; sources: string; replay: string; you: string; bot: string; noMic: string; type: string; send: string; examples: string[] }> = {
  ur: { tap: "بات کریں", listening: "سن رہی ہوں…", thinking: "سوچ رہی ہوں…", speaking: "بول رہی ہوں…", greet: "السلام علیکم! میں ہم قدم ہوں۔ شناختی کارڈ یا ووٹ کے بارے میں پوچھیں۔", sources: "حوالہ جات", replay: "دوبارہ سنیں", you: "آپ", bot: "ہم قدم", noMic: "آواز دستیاب نہیں — لکھ کر پوچھیں", type: "یہاں لکھیں…", send: "بھیجیں", examples: ["شناختی کارڈ کیسے بنواؤں؟", "کیا میں ووٹر کے طور پر رجسٹرڈ ہوں؟", "ووٹ کیسے ڈالوں؟"] },
  pa: { tap: "گل کرو", listening: "سن رہی آں…", thinking: "سوچ رہی آں…", speaking: "بول رہی آں…", greet: "السلام علیکم! میں ہم قدم آں۔ شناختی کارڈ یا ووٹ بارے پُچھو۔", sources: "حوالے", replay: "دوبارہ سنو", you: "تُسی", bot: "ہم قدم", noMic: "آواز دستیاب نہیں — لکھ کے پُچھو", type: "ایتھے لکھو…", send: "بھیجو", examples: ["شناختی کارڈ کیویں بݨواواں؟", "کیہ میں ووٹر رجسٹرڈ آں؟", "ووٹ کیویں پاواں؟"] },
  ps: { tap: "خبرې وکړئ", listening: "اورم…", thinking: "فکر کوم…", speaking: "وایم…", greet: "السلام علیکم! زه هم قدم یم. د پیژندنې کارت یا رایې په اړه پوښتنه وکړئ.", sources: "سرچينې", replay: "بیا واورئ", you: "تاسو", bot: "هم قدم", noMic: "غږ شتون نلري — ولیکئ", type: "دلته ولیکئ…", send: "ولېږئ", examples: ["د پیژندنې کارت څنګه جوړ کړم؟", "ایا زه راجستر شوی یم؟", "څنګه رایه ورکړم؟"] },
  en: { tap: "Talk", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…", greet: "Assalam-o-alaikum! I am HumQadam. Ask me about your CNIC or your vote.", sources: "Sources", replay: "Replay", you: "You", bot: "HumQadam", noMic: "Voice unavailable — type your question", type: "Type here…", send: "Send", examples: ["How do I get a CNIC?", "Am I registered to vote?", "How do I cast my vote?"] },
};

type Status = "idle" | "listening" | "thinking" | "speaking";

interface Message {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  audioUrl?: string;
}

export default function VoiceWidget() {
  const [lang, setLang] = useState<Lang>(LANGS[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const [typed, setTyped] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const t = UI[lang.code];

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) setMicSupported(false);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim]);

  // On-device fallback voice (Web Speech API) for when the backend TTS
  // endpoint is unavailable (e.g. edge-tts blocked on datacenter IPs).
  const browserSpeak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setStatus("idle");
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang.srLang;
      const voices = window.speechSynthesis.getVoices();
      const match =
        voices.find((v) => v.lang?.toLowerCase() === lang.srLang.toLowerCase()) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith(lang.code));
      if (match) u.voice = match;
      u.onend = () => setStatus("idle");
      u.onerror = () => setStatus("idle");
      window.speechSynthesis.cancel();
      setStatus("speaking");
      window.speechSynthesis.speak(u);
    },
    [lang.srLang, lang.code]
  );

  const speak = useCallback(
    async (text: string): Promise<string | undefined> => {
      try {
        const url = await fetchTTS(text, lang.code);
        if (audioRef.current) {
          audioRef.current.src = url;
          setStatus("speaking");
          await audioRef.current.play().catch(() => browserSpeak(text));
        }
        return url;
      } catch {
        browserSpeak(text); // fall back to on-device voice; conversation continues
        return undefined;
      }
    },
    [lang.code, browserSpeak]
  );

  const handleUserUtterance = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setError("");
      setInterim("");
      setMessages((m) => [...m, { role: "user", text: clean }]);
      setStatus("thinking");

      const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.text }));
      try {
        const res = await sendChat(clean, lang.code, history);
        const audioUrl = await speak(res.reply);
        setMessages((m) => [
          ...m,
          { role: "assistant", text: res.reply, sources: res.sources, audioUrl },
        ]);
      } catch (e: any) {
        setError(e?.message || "Something went wrong.");
        setStatus("idle");
      }
    },
    [messages, lang.code, speak]
  );

  const startListening = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setMicSupported(false);
      return;
    }
    setError("");
    const rec = new Ctor();
    rec.lang = lang.srLang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setStatus("listening");
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (finalText) {
        setInterim("");
        rec.stop();
        handleUserUtterance(finalText);
      }
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") setError(`Mic: ${e.error}`);
      setStatus("idle");
    };
    rec.onend = () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    };

    recognitionRef.current = rec;
    rec.start();
  }, [lang.srLang, handleUserUtterance]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus("idle");
  }, []);

  const onTalkClick = () => {
    if (status === "listening") stopListening();
    else if (status === "idle") startListening();
  };

  const onAudioEnded = () => setStatus("idle");

  const replay = (m: Message) => {
    if (m.audioUrl && audioRef.current) {
      audioRef.current.src = m.audioUrl;
      setStatus("speaking");
      audioRef.current.play().catch(() => browserSpeak(m.text));
    } else {
      browserSpeak(m.text);
    }
  };

  const busy = status === "thinking" || status === "speaking";
  const dir = lang.rtl ? "rtl" : "ltr";

  return (
    <div dir={dir} className={lang.rtl ? "font-urdu" : ""}>
      {/* Language toggle */}
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              l.code === lang.code
                ? "bg-primary text-white shadow"
                : "glass text-ink/70 hover:text-ink"
            }`}
          >
            {l.native}
          </button>
        ))}
      </div>

      {/* Talk button */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {status === "listening" && (
            <span className="absolute inset-0 animate-pulseRing rounded-full bg-primary/40" />
          )}
          <button
            onClick={onTalkClick}
            disabled={busy || !micSupported}
            aria-label={t.tap}
            className={`relative z-10 grid h-40 w-40 place-items-center rounded-full text-white shadow-[0_16px_50px_-12px_rgba(27,156,133,0.7)] transition active:scale-95 disabled:opacity-60 ${
              status === "listening" ? "bg-primaryDark" : "bg-primary hover:bg-primaryDark"
            } ${status === "idle" ? "animate-breathe" : ""}`}
          >
            {status === "thinking" ? (
              <Dots />
            ) : status === "speaking" ? (
              <Bars />
            ) : (
              <MicIcon />
            )}
          </button>
        </div>
        <p className="mt-4 text-lg font-semibold text-ink">
          {status === "idle" && t.tap}
          {status === "listening" && t.listening}
          {status === "thinking" && t.thinking}
          {status === "speaking" && t.speaking}
        </p>
        {interim && <p className="mt-1 max-w-md text-center text-ink/60">{interim}</p>}
      </div>

      {/* Example-question chips — shown only before a conversation starts */}
      {messages.length === 0 && status === "idle" && (
        <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2 animate-fadeUp">
          {t.examples.map((ex) => (
            <button
              key={ex}
              onClick={() => handleUserUtterance(ex)}
              disabled={busy}
              className="rounded-full border border-primary/30 bg-white/70 px-4 py-2 text-sm text-ink/80 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:text-ink disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Text fallback (always available; essential when mic unsupported) */}
      {(!micSupported || messages.length > 0) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && typed.trim()) {
              handleUserUtterance(typed);
              setTyped("");
            }
          }}
          className="mx-auto mt-5 flex max-w-md gap-2"
        >
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={micSupported ? t.type : t.noMic}
            className="flex-1 rounded-full border border-ink/15 bg-white/80 px-4 py-2 outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !typed.trim()}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {t.send}
          </button>
        </form>
      )}

      {error && (
        <p className="mx-auto mt-3 max-w-md rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Conversation transcript + source cards */}
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="mx-auto mt-8 max-h-[42vh] max-w-2xl space-y-4 overflow-y-auto px-1"
        >
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[85%] ${m.role === "user" ? "" : "w-full"}`}>
                <div className="mb-1 text-xs text-ink/40">{m.role === "user" ? t.you : t.bot}</div>
                <div
                  className={`rounded-2xl px-4 py-3 text-[17px] leading-relaxed ${
                    m.role === "user" ? "bg-ink text-white" : "glass text-ink"
                  }`}
                >
                  {m.text}
                </div>

                {m.role === "assistant" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => replay(m)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primaryDark hover:bg-primary/20"
                    >
                      ▶ {t.replay}
                    </button>
                  </div>
                )}

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2">
                    <div className="mb-1 text-xs font-medium text-ink/50">{t.sources}</div>
                    <div className="flex flex-col gap-1.5" dir="ltr">
                      {m.sources.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-2 rounded-lg border border-ink/10 bg-white/60 px-3 py-1.5 text-left text-xs text-ink/70 hover:border-primary/40"
                        >
                          <span className="text-primary">🔗</span>
                          <span className="flex-1 truncate group-hover:text-ink">{s.title}</span>
                          {s.verified && (
                            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primaryDark">
                              ✓ {s.verified}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <audio ref={audioRef} onEnded={onAudioEnded} hidden />
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function Dots() {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-white"
          style={{ animation: "bar 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Bars() {
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded bg-white"
          style={{ height: 28, transformOrigin: "bottom", animation: "bar 0.9s ease-in-out infinite", animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
