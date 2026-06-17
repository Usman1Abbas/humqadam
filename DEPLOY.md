# Deploying HumQadam (free) — Render + Vercel

Goal: a public link you can share so anyone can try HumQadam.
Architecture: **frontend on Vercel**, **FastAPI backend on Render**. Both free.

> ⚠️ Deploy the **backend first** — you need its URL before building the frontend
> (the frontend bakes the API URL in at build time).

---

## Step 1 — Backend on Render (FastAPI)

1. Go to **render.com** → sign up (use "Sign in with GitHub").
2. **New ➜ Blueprint** → pick the `Usman1Abbas/humqadam` repo → Render reads `render.yaml`.
   - (Or: **New ➜ Web Service**, root directory `api`, build `pip install -r requirements.txt`,
     start `uvicorn main:app --host 0.0.0.0 --port $PORT`.)
3. When prompted for env vars, paste your secrets:
   - `GEMINI_API_KEY` = your Google Gemini key
   - `OPENROUTER_API_KEY` = your OpenRouter key (a free account is fine — powers the Gemma tier)
4. Click **Deploy**. Wait ~2–4 min.
5. Copy the service URL, e.g. `https://humqadam-api.onrender.com`.
6. **Verify:** open `https://humqadam-api.onrender.com/health` → should show
   `"status":"ok"`, the model `chain`, and `"has_api_key":true`.

---

## Step 2 — Frontend on Vercel (Next.js)

1. Go to **vercel.com** → sign up with GitHub → **Add New ➜ Project** → import `humqadam`.
2. **Root Directory:** set to `web`.
3. **Environment Variables:** add
   - `NEXT_PUBLIC_API_URL` = your Render URL from Step 1 (e.g. `https://humqadam-api.onrender.com`)
4. Click **Deploy**. Wait ~1–2 min.
5. You get a public link like `https://humqadam.vercel.app` — **that's the link you share.**

---

## Step 3 — Before you share it with judges

- **Warm the backend.** Render's free tier sleeps after ~15 min idle; the first request then
  takes ~50s to wake. Hit `…onrender.com/health` once right before sharing, or keep it awake
  with a free pinger (e.g. cron-job.org → GET `/health` every 10 min).
- **Tell judges: "open in Google Chrome"** — voice input (mic) uses the Web Speech API, which
  works in Chrome/Edge (desktop + Android). On Safari/iOS the **text box** works as a fallback.
- **Do a test run yourself** on the live link (ask one Urdu question) to confirm voice + answers.

---

## Notes & known limits on the hosted version
- **Speech-to-text** is browser-side (Chrome/Edge). The typed input works everywhere.
- **Text-to-speech**: edge-tts may be blocked on cloud IPs; if so the app auto-falls back to the
  browser voice — audio still plays. (For premium hosted TTS later, swap `/tts` for a hosted
  provider in `api/main.py`.)
- **Rate limits**: the free LLM **fallback chain** (Gemini Flash-Lite → Gemma-4-31B free → Gemini
  Flash) keeps it working under light concurrent load; very heavy simultaneous traffic may still
  hit free-tier caps.
- **Redeploys**: push to `main` → Vercel and Render auto-redeploy.
