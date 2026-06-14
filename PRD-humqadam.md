# PRD: HumQadam (ہم قدم) — Voice-First Civic & Voter Assistant

**Author:** Usman Abbas
**Date:** 2026-06-04
**Status:** Draft
**Version:** 1.0
**Context:** Hackathon submission — Theme 1: Democracy, Inclusion & Civic Participation

---

## 1. Overview

### 1.1 Problem Statement
In Pakistan, millions of women are locked out of the democratic process before they ever reach a ballot box. In the 2024 general elections women's turnout was **43% vs men's 52%**, and an estimated **~3.5 million eligible women remain off the electoral rolls** — enough to alter results in 100+ of 266 National Assembly constituencies (IGC). The root bottleneck is upstream of voting: a **CNIC (NADRA national ID) is a hard prerequisite to register**, and it is missing disproportionately among young and rural/urban-poor women.

The barrier is **informational and social, not logistical**: women rely on relatives/acquaintances for civic information **66% of the time vs only ~13% from official NADRA/ECP channels** (IFES), and most never initiate the CNIC process themselves. Existing channels fail this user precisely because they assume the three things she lacks:

- **Literacy** — official info is text (ECP 8300 SMS, web portals, forms).
- **A smartphone she controls** — only **26% of women own a smartphone vs 52% of men** (GSMA/CDPR); apps are a non-starter.
- **Freedom to seek information in public** — mobility and male gatekeeping constrain in-person help.

### 1.2 Motivation
A woman who cannot read, does not own a smartphone, and cannot easily leave home **can still answer a phone and talk.** Voice is the one interface that clears all three barriers at once. Conversational AI in local languages now makes a private, judgment-free, always-available civic guide technically feasible for the first time — and the supporting voice tech for Pakistani languages already exists off the shelf (Uplift AI, Zudu.ai). The gap is real, evidenced, and unserved (see §10).

### 1.3 Target Users
- **Primary:** Pakistani women (18–40), low-literacy or non-literate, rural or urban-poor, who do not have a CNIC and/or are not registered to vote. Often accessing a shared/family phone.
- **Secondary:** Field workers and NGO volunteers (e.g. Aurat Foundation–style registration drives) who can put the line in front of women at scale; first-time youth voters generally.
- **Out of scope as users (v1):** Diaspora/overseas voters, political-party canvassers, election officials.

---

## 2. Goals & Success Metrics

### 2.1 Goals
- Let any user **complete a guided, spoken conversation** that takes her from "I don't have a CNIC / I'm not registered" to a **clear, personalized, actionable next-step plan** — in her own language, with no reading required.
- Ground every civic answer in **verified official sources** so the information is trustworthy and demonstrably non-partisan.
- Prove the experience works **over voice in Urdu** (with a regional-language switch as the inclusion wow-moment).

### 2.2 Non-Goals (v1 / hackathon)
- ❌ Not a real telephony/PSTN deployment (web voice widget for the demo; phone-call delivery is the post-hackathon roadmap).
- ❌ Not the full four-stage journey — **polling-station lookup and "why/how to vote" are explicitly deferred** (pitched as roadmap).
- ❌ No real integration with NADRA/ECP backend systems or live voter-roll lookups (data is read-only public info via RAG).
- ❌ Not transactional — HumQadam **guides**, it does not submit a CNIC application or register anyone.
- ❌ No user accounts, no persistent personal data storage.
- ❌ Arabic / MENA expansion is roadmap only.

### 2.3 Success Metrics
**Demo-time (judge-facing):**
- A judge completes a full spoken CNIC→registration flow end-to-end with zero reading.
- Every factual claim the bot makes is traceable to a cited official source on screen.
- Language switch (Urdu → Punjabi/Urdu-regional) demonstrated live.
- End-to-end voice round-trip latency target: **< 4 seconds** per turn.

**Product north-star (post-hackathon framing):**
- % of callers who reach a defined "actionable next step" (CNIC checklist or registration steps).
- Female CNIC-acquisition / registration completion attributable to the line (via NGO field partners).

---

## 3. User Stories & Use Cases

### 3.1 User Stories
- *As a woman with no CNIC,* I want to ask out loud "I don't have an ID card, what do I do?" and be told exactly which documents to bring and where to go, so I can start the process.
- *As a non-literate user,* I want to **hear** everything and **speak** my answers, so I never have to read or type.
- *As someone unsure if I'm registered,* I want to be told how to check and what registration requires, so I know my status and next step.
- *As a skeptical user,* I want to know the information is official and trustworthy, not rumor.
- *As a Punjabi/Pashto speaker,* I want to switch to my mother tongue, so I fully understand.

### 3.2 Core Use Cases (the two MVP flows)

**Flow A — "I don't have a CNIC" (the access bottleneck)**
1. User taps "Talk" (web widget) → hears a spoken Urdu greeting: *"السلام علیکم، میں ہم قدم ہوں۔ میں آپ کی شناختی کارڈ اور ووٹ کے بارے میں مدد کر سکتی ہوں۔"*
2. User speaks freely: *"میرے پاس شناختی کارڈ نہیں ہے۔"*
3. Bot asks 1–2 clarifying questions by voice (age over 18? have a B-Form / family registration?).
4. Bot returns a **spoken, step-by-step plan**: documents needed, nearest NADRA center / Mobile Registration Van concept, fee, female-staff Friday counters — grounded in official NADRA info, with on-screen source cards.
5. Bot offers to repeat, slow down, or switch language.

**Flow B — "Am I registered / how do I register to vote?"**
1. From the same conversation (or fresh), user asks about voting eligibility/registration.
2. Bot explains the CNIC→roll linkage, how to verify registration (the 8300 mechanism, explained *for* her rather than requiring she text it), and what registration involves.
3. Bot hands off a clear next action and confirms understanding.

**Cross-cutting interaction rules**
- Bot always speaks first and drives; never assumes the user can read the screen.
- Bot confirms understanding ("کیا میں دوبارہ بتاؤں؟") and supports "repeat / slower / change language" by voice at any point.
- If asked anything partisan ("who should I vote for?"), bot **refuses neutrally** and redirects to process.

---

## 4. Functional Requirements

### 4.1 Voice I/O (web widget)
- **FR-1.1** Browser "tap to talk" button captures mic audio (push-to-talk for demo reliability; VAD/auto-endpointing if time permits).
- **FR-1.2** Speech-to-text for Urdu (and ≥1 regional language) via Uplift AI ASR (fallback: Whisper-large).
- **FR-1.3** Text-to-speech replies in a natural Urdu female voice via Uplift AI TTS (fallback: ElevenLabs Urdu).
- **FR-1.4** Audio plays automatically on reply; a visible "speaking" indicator and replay button are present.
- **FR-1.5** Target per-turn latency < 4s; show a listening/thinking state so silence never feels broken.

### 4.2 Conversational engine
- **FR-2.1** LLM (Claude) orchestrates a **multi-turn dialog** with a system prompt enforcing: speak first, one idea per turn, short spoken-friendly sentences, confirm understanding, never require reading.
- **FR-2.2** Bot handles free-form, messy, colloquial input — not a fixed menu. (This is the core differentiator vs. press-1 IVR.)
- **FR-2.3** **Guardrails:** strict non-partisanship; refuse candidate/party recommendations; no legal advice beyond official process; decline out-of-scope topics gracefully.
- **FR-2.4** Language detection + explicit "switch language" intent handling.

### 4.3 Knowledge grounding (RAG)
- **FR-3.1** Ingest verified public sources into a vector store: NADRA CNIC requirements/process pages, ECP voter-registration/8300 info, relevant official FAQs.
- **FR-3.2** Every civic answer is generated **only** from retrieved chunks; the prompt forbids unsourced factual claims about process/fees/documents.
- **FR-3.3** Each answer surfaces **source citations** on screen (title + link) so judges see grounding — even though the user experience is voice-only.
- **FR-3.4** If retrieval returns nothing relevant, bot says it doesn't know and points to the official helpline rather than guessing.

### 4.4 Frontend / UI
- **FR-4.1** Single-page, mobile-first web app with a large central talk button (designed for someone who *won't* read — minimal text, iconographic, RTL Urdu layout).
- **FR-4.2** Live transcript panel (for judges/observers) showing user speech, bot reply, and source cards. The transcript is a *demonstration aid*, not required for the end user.
- **FR-4.3** Language toggle (Urdu / regional) prominently placed.
- **FR-4.4** A short "what is this?" hero/landing section for judges (positioning, the 3.5M stat, the differentiator).

---

## 5. Non-Functional Requirements

### 5.1 Performance
- < 4s per voice turn end-to-end on demo Wi-Fi. Stream TTS playback as soon as first audio chunk is ready if the SDK allows.

### 5.2 Accessibility (the whole point)
- Fully operable **without reading or typing** — voice in, voice out.
- RTL rendering for Urdu; large touch target for the talk button; high-contrast.
- Designed to degrade to the post-hackathon **basic-phone/IVR** channel (no UI dependency in the core dialog logic).

### 5.3 Trust & Safety
- Non-partisan by construction; on-screen sourcing; explicit "this is guidance, verify with NADRA/ECP" disclaimer in voice and text.
- No storage of personal identifiers; conversation is ephemeral.

### 5.4 Reliability (demo-critical)
- Push-to-talk default to avoid mic/VAD failures on stage.
- Pre-cached TTS for the greeting and 2–3 most likely first answers as a latency/safety net.
- Graceful fallback chain on each external API (ASR, LLM, TTS).

---

## 6. Technical Design

### 6.1 Architecture Overview
```
[Browser mic] → push-to-talk capture
      │ audio
      ▼
[ASR: Uplift AI / Whisper]  → Urdu/regional text
      │
      ▼
[Orchestrator API]  ── retrieve ──▶ [Vector store: ECP/NADRA docs]
      │  (prompt + retrieved context + dialog state)
      ▼
[LLM: Claude]  → spoken-style reply text + cited sources
      │
      ▼
[TTS: Uplift AI Urdu voice]  → audio
      │
      ▼
[Browser] autoplay audio + render transcript & source cards
```

### 6.2 Tech Stack
- **Frontend:** Next.js / React, Tailwind, mobile-first RTL. (Optionally use the cinematic-landing-page approach for the judge-facing hero.)
- **Backend/orchestrator:** Node or Python (FastAPI) — single endpoint that runs retrieve → LLM → returns text + sources; TTS/ASR called from server or client per SDK.
- **LLM:** Claude (claude-opus-4-8 or sonnet for latency) with prompt caching on the system prompt + retrieved context.
- **Voice:** Uplift AI (Urdu + regional TTS/ASR) primary; Whisper + ElevenLabs Urdu as fallbacks.
- **Vector store:** lightweight — local FAISS or Supabase pgvector; embeddings via a multilingual model.
- **Hosting:** Vercel (frontend) + a small API host; all keys server-side.

### 6.3 Data Model (minimal — no user PII)
| Entity | Fields | Notes |
|---|---|---|
| `SourceDoc` | id, title, url, lang, raw_text | Official ECP/NADRA public content |
| `Chunk` | id, source_id, text, embedding | RAG retrieval unit |
| `Turn` (ephemeral) | role, text, lang, cited_source_ids | In-memory per session; not persisted |
| `SessionState` (ephemeral) | language, flow (A/B), collected_facts | Drives multi-turn logic |

### 6.4 Integrations
- Uplift AI / Zudu.ai (voice), Whisper, ElevenLabs (fallback), Claude API, embedding API. **No** live NADRA/ECP system integration in v1.

---

## 7. UX & Design

### 7.1 Key Screens / Flows
1. **Hero / "what is this"** — one screen: the 3.5M-women stat, the one-line pitch, a single CTA: a large **"بات کریں" (Talk)** button.
2. **Conversation view** — the talk button center-stage, a "speaking…/listening…" animation, language toggle, and a side/below transcript + source cards (for judges).
3. **Next-step summary card** — at the end of a flow, the actionable plan is shown as large iconographic steps *and* spoken.

### 7.2 Wireframe Notes
- Design for a user who will **not read**: voice carries 100% of the essential content; visuals are reassurance/affordance only.
- Urdu RTL throughout; numerals and key nouns in large type; generous spacing; warm, non-clinical tone.

---

## 8. Scope & Milestones

### 8.1 MVP Scope (24h, small team)
- Web voice widget (push-to-talk) in **Urdu**, with a **regional-language switch** demoed.
- **Two flows:** (A) CNIC acquisition, (B) voter-registration guidance.
- **RAG over real ECP/NADRA public docs** with on-screen citations.
- Non-partisan guardrails + disclaimer.
- Judge-facing hero/landing with positioning.

### 8.2 Suggested 24h split (2–4 people)
- **Voice/ASR-TTS engineer:** Uplift integration, latency, fallbacks, language switch.
- **Backend/RAG engineer:** scrape + chunk + embed ECP/NADRA docs, retrieval, orchestrator endpoint, prompt + guardrails.
- **Frontend engineer:** widget, transcript/source cards, RTL hero, summary card.
- **Float / pitch:** content accuracy (verify every fact vs. source), demo script, slides.

### 8.3 Future Phases (roadmap — pitch these)
- **Real telephony/IVR** so it works on a basic feature phone (the true thesis) — Twilio/local carrier + the same dialog core.
- Stages 3–4: **polling-station lookup** and **"why/how to vote"** education.
- More languages (Pashto, Saraiki, Sindhi); **Arabic for MENA** (Egypt/Jordan).
- NGO field-partner deployment (Aurat Foundation–style drives); WhatsApp voice channel.
- Optional live ECP 8300 / NADRA status integration.

---

## 9. Risks & Dependencies

### 9.1 Technical Risks
| Risk | Mitigation |
|---|---|
| Urdu/regional ASR accuracy on noisy mic | Push-to-talk; Uplift primary + Whisper fallback; pre-cache greeting; test on demo hardware early |
| Latency > 4s breaks the magic | Streaming TTS; smaller/faster LLM tier; prompt caching; pre-cached common answers |
| Regional-language TTS quality weaker than Urdu | Lead the demo in Urdu; use the regional switch as a brief wow-moment, not the core flow |
| Wi-Fi/API failure on stage | Local fallbacks + a pre-recorded backup video of a successful run |
| Factual inaccuracy → loses judge trust | Strict RAG-only answering; on-screen citations; human-verify every demo-path fact |

### 9.2 Dependencies
- Uplift AI / Zudu.ai access (or fallbacks), Claude API key, embedding API, accurate current ECP/NADRA public source pages.

### 9.3 Open Questions
- Exact current (2024–26) CNIC requirements/fees — confirm against live NADRA pages before demo (research data on ownership splits is dated; the *process* is current).
- Which single regional language best lands with this hackathon's judges (Punjabi most spoken; Pashto/Sindhi may resonate regionally)?
- Is even a short-code/Twilio number worth attempting as a stretch to strengthen the "basic phone" claim?

---

## 10. Appendix — Competitive Analysis & Positioning

**Verdict from prior deep research + web + LinkedIn scans: the exact product is not implemented.** The defensible novelty is the intersection: **conversational LLM voice + the CNIC→vote journey + Pakistani regional languages over a basic phone.**

| Existing | What it is | Why HumQadam differs |
|---|---|---|
| **ECP 8300 SMS** | Text CNIC → polling lookup | Text-gated, literacy-required, lookup-only, assumes you're already registered. We're spoken, guide the *upstream* CNIC/registration gap it skips. |
| **Viamo "Calling all Women"** (closest) | IVR info line, 150k+ low-literacy women in Pakistan | **Scripted press-1 menus on health/finance — not civic.** We're conversational and voter-specific. (Proves women *will* use a phone line.) |
| **Gram Vaani / Mobile Vaani** | Participatory community-radio IVR (India) | India; broadcast/menu model, not a 1:1 conversational voter guide. |
| **Voter Saathi** (ECI India) | Voter-info chatbot | Text/web, literacy + internet required — opposite of voice-first. |
| **Raaji** (Saba Khalid) | AI chatbot for rural women's health | Adjacent domain (health), proves the model; civic lane open. |
| **Election-AI in Pakistan** | Voice clones, candidate chatbots, deepfakes | All on the **campaign/disinfo** side. The **voter-access/inclusion** side is empty. |

**Building blocks (de-risk):** Uplift AI, Zudu.ai, Zahanat Z2 ship Urdu + regional TTS/ASR — assemble, don't invent.

**Pitch pre-empt for "doesn't this exist?":** *"8300 tells you where to vote if you're already registered and literate. Viamo proved low-literacy women will use a phone line — but it's scripted menus on non-civic topics. HumQadam is conversational, civic-specific, in her mother tongue, and covers the registration gap both skip."*

**Key evidence:** women's 2024 turnout 43% vs 52% men; ~3.5M women off the rolls (can shift 100+/266 seats); 26% women vs 52% men own smartphones (→ voice, not app); women rely on relatives 66% vs official channels 13% (→ a trusted private guide). Sources: IGC, IFES, GSMA/CDPR, ECP, Viamo/USAID.
