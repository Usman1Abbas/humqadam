const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Source {
  id: string;
  title: string;
  url: string;
  verified?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  sources: Source[];
  language: string;
}

export async function sendChat(
  message: string,
  language: string,
  history: ChatTurn[]
): Promise<ChatResult> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language, history }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Chat failed (${res.status}): ${detail}`);
  }
  return res.json();
}

/** Fetch synthesized speech and return an object URL for an <audio> element. */
export async function fetchTTS(text: string, language: string): Promise<string> {
  const res = await fetch(`${API_URL}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status})`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
