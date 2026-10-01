# ResQNet — *When Every Second Counts.*

An AI-powered multi-agent emergency coordination platform for Pakistan that
intelligently connects patients with hospitals, specialists, ambulances, blood
resources, medical reports, and emergency guidance. ResQNet is a coordination
layer — it does **not** replace hospitals, ambulance services, blood banks,
or emergency responders.

> ⚠️ **Disclaimer:** ResQNet provides recommendations only and is not a
> substitute for professional medical advice. Always contact local emergency
> services (1122) for life-threatening situations.

---

## ✨ Features

- **7 AI agents** orchestrated by a Coordinator (Triage, Hospital, Bed, Blood,
  Ambulance, Document, Coordinator) — all powered by Groq's
  `llama-3.3-70b-versatile` model (swappable to `gemma-3-27b-it` via a single
  env var). The Z-AI Web Dev SDK is used as a graceful fallback when Groq is
  unreachable.
- **Human Approval Gate** — every AI-generated plan stays in `draft` status
  until a human clicks **Approve Plan**. Only after approval does the
  ambulance actually dispatch. Implements the AI principle:
  **AI Recommendation → Human Review → Confirm → Execute**.
- **Confidence Scores** — Diagnosis Confidence, Hospital Match, Emergency
  Priority, Ambulance Match, Blood Match, Bed Availability — rendered as
  animated progress bars with color-coded Emergency Priority badges
  (Critical / High / Medium / Low).
- **Agent Reasoning Panel** — explains *why* each decision was made (e.g.
  "Hospital selected because: Cardiac specialist available, ICU available,
  Only 6 km away, Level 3 emergency capability, Rated 4.7/5").
- **Urdu Voice Input** — microphone button supports Urdu (`ur-PK`),
  Roman Urdu, and English. Transcript is sent automatically to the AI
  Coordinator.
- **Agent Status Animation** — live status text per agent while processing:
  ✓ Triage Agent → Searching Hospital… → Checking Bed… → Finding Blood… →
  Calling Ambulance… → Reading Medical Reports… → Coordinator Generating Plan…
- **Emergency Timeline** — 7-step professional timeline: Emergency Detected →
  Triage Completed → Hospital Selected → Bed Available → Blood Found →
  Ambulance Assigned → Final Emergency Plan.
- **Real-time Notifications** — Socket.IO broadcasts emergency status to all
  dashboard clients (analysis started, plan ready, ambulance dispatched).
- **Live WebSocket Ambulance Tracking** — animated SVG map, ETA, speed,
  telemetry, and event log.
- **Medical Report Analysis** — upload PDF / PNG / JPG prescriptions, lab
  reports, MRI reports, discharge summaries. Document Agent OCR-summarises
  patient history, diagnosis, medicines, allergies, risks, important findings.
- **Map Section** — current location, recommended hospital, ambulance route,
  ETA, mock-friendly SVG mini-map (Google Maps upgradeable via env var).
- **Emergency Actions** — Call Hospital, Call Ambulance, Share Location,
  Download Emergency Plan, Family Notification (WhatsApp / SMS / Copy link).
- **Multi-language UI** — English / Urdu (اردو) / Roman Urdu with instant
  switching (535+ i18n keys).
- **JWT auth** with bcrypt password hashing and role-based admin panel.
- **MongoDB Atlas** persistence — users, profiles, emergency plans,
  requests, activity logs, hospitals, specialists, ambulances, blood banks.

---

## 🧱 Tech Stack

| Layer       | Technology                                                |
|-------------|-----------------------------------------------------------|
| Frontend    | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4         |
| UI          | shadcn/ui (New York), Lucide icons, Framer Motion           |
| Backend     | Next.js API routes (Node runtime)                          |
| Database    | MongoDB Atlas                                              |
| AI (primary)| Groq SDK · `llama-3.3-70b-versatile` (switchable to `gemma-3-27b-it`) |
| AI (fallback) | Z-AI Web Dev SDK (LLM + VLM + ASR + TTS)                 |
| Real-time   | Socket.IO mini-service on port 3003                         |
| Auth        | JWT (jsonwebtoken) + bcryptjs                              |
| State       | Zustand (client), TanStack Query (optional server)         |
| Maps        | Google Maps (optional) — falls back to SVG mini-map        |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                          USER                              │
│  (types symptoms / speaks Urdu / uploads report)           │
└──────────────┬─────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────┐
│                Coordinator Agent (orchestrator)            │
│  - calls each agent in sequence                           │
│  - collects structured outputs                            │
│  - synthesises the final Emergency Plan                    │
└───┬───────────┬───────────┬───────────┬───────────┬───────┘
    │           │           │           │           │
    ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌─────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
│ Triage │ │ Hospital│ │ Bed  │ │ Blood  │ │Ambulance │  ... + Document
│ Agent  │ │  Agent  │ │ Agent│ │ Agent  │ │  Agent   │      + Specialist
└────────┘ └─────────┘ └──────┘ └────────┘ └──────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────┐
│              Emergency Plan (status: draft)                │
│  Triage · Hospital · Specialist · Ambulance · Blood · Bed  │
│  Capacity · Safety Guidance · Medical Summary · Next Steps │
│  Agent Reasoning · Confidence Scores                       │
└──────────────┬─────────────────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────────┐
│                  Human Approval Gate                      │
│  [Approve Plan]  [Reject & Re-analyze]                     │
└──────────────┬─────────────────────────────────────────────┘
               │ (only after approval)
               ▼
┌────────────────────────────────────────────────────────────┐
│         Ambulance Dispatched · Status: dispatched         │
└────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ResQNet/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Single visible route — orchestrates views
│   │   └── api/                           # 15 API routes
│   │       ├── auth/{login,signup,otp}/route.ts
│   │       ├── emergency/analyze/route.ts # Orchestrates 9 agents, persists plan
│   │       ├── ocr/route.ts  asr/route.ts  tts/route.ts
│   │       ├── hospitals/route.ts  ambulances/route.ts  blood/route.ts
│   │       ├── history/route.ts  contacts/route.ts
│   │       ├── groq/health/route.ts       # Groq connectivity health check
│   │       └── admin/[resource]/route.ts
│   ├── lib/
│   │   ├── services/
│   │   │   └── groqService.ts              # Reusable Groq LLM client (modular, switchable model)
│   │   ├── prompts/
│   │   │   └── index.ts                    # All agent system prompts (modular)
│   │   ├── agents/                          # 9 AI agents (LLM + heuristic fallback)
│   │   ├── ai.ts                            # chat() wrapper routing through Groq first
│   │   ├── mongodb.ts                      # MongoDB singleton + graceful fallback
│   │   ├── i18n.ts                          # 535 translation keys (EN/UR/RUR)
│   │   ├── store.ts                         # Zustand store
│   │   ├── auth.ts                          # JWT helpers + bcrypt
│   │   └── demo-data.ts                     # Seed data
│   ├── components/
│   │   └── resqnet/                         # 28 ResQNet components
│   │       ├── HumanApprovalGate.tsx        # ⚠️ Approval gate (NEW)
│   │       ├── ConfidenceScores.tsx         # ⚡ Confidence bars + reasoning panel (NEW)
│   │       ├── AgentCards.tsx               # 🤖 7-agent overview on dashboard (NEW)
│   │       ├── GroqStatusBadge.tsx          # 🟢 "Powered by Groq" badge (NEW)
│   │       ├── AnimatedAgentPipeline.tsx   # 🟢 Live status text per agent
│   │       ├── VoiceAssistant.tsx           # 🟢 Urdu / Roman Urdu / English selector
│   │       ├── NotificationsPanel.tsx
│   │       ├── LiveTrackingModal.tsx
│   │       └── … (24 components total)
│   └── hooks/
│       ├── use-ambulance-tracking.ts
│       ├── use-notifications.ts
│       └── use-t.ts
├── mini-services/
│   └── ambulance-tracker/                  # Socket.IO service on port 3003
├── scripts/
│   ├── test-mongodb.mjs                    # MongoDB connectivity test
│   ├── verify-collections.mjs              # Verify MongoDB collections state
│   └── e2e-smoke.mjs                       # 30-assertion E2E smoke test
├── tests/e2e/resqnet.spec.js               # Playwright golden-path test
├── playwright.config.js
├── vercel.json                             # Vercel deployment config
├── render.yaml                             # Render backend deployment config
├── .env.example                            # Environment variable template
├── LICENSE                                 # MIT
└── README.md                               # this file
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js ≥ 18 (for `next dev`)
- Bun ≥ 1.0 (recommended)
- MongoDB Atlas cluster with a `ResQNet` database
- Groq API key (free at https://console.groq.com/keys)

### Setup

```bash
# 1. Install dependencies
bun install

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in: GROQ_API_KEY, MONGODB_URI, JWT_SECRET

# 3. (Optional) Verify MongoDB connectivity
node scripts/test-mongodb.mjs

# 4. Start the dev server
bun run dev
# → http://localhost:3000

# 5. (In a separate terminal) Start the WebSocket mini-service
cd mini-services/ambulance-tracker
bun install
bun index.ts
# → WebSocket server on port 3003
```

On first load, ResQNet auto-seeds the `hospitals`, `specialists`,
`ambulances`, and `blood_resources` collections into your MongoDB Atlas.

### Demo login

```
Email:    admin@resqnet.io
Password: admin123
```

### Tests

```bash
# Lint
bun run lint

# E2E smoke (30 assertions — landing, auth, AI pipeline, persistence)
bun run test:smoke

# Playwright golden-path (requires Playwright + dev server running)
bun run test:e2e
```

---

## 🤖 Groq Integration

ResQNet uses **Groq** as the primary LLM provider for all 7 AI agents.
Groq's `llama-3.3-70b-versatile` is the default model — chosen for its fast
inference, multi-lingual support (English / Urdu), and large context window.

### Why Groq?
- **Fast inference** — Groq's LPU chip delivers 500+ tokens/sec on
  llama-3.3-70b, ideal for emergencies where every second counts.
- **Open models** — switchable to `gemma-3-27b-it` or any other Groq-supported
  model by changing a single env var (`GROQ_MODEL`).
- **Free tier** — generous free quota at https://console.groq.com/keys.

### How the integration works

1. `src/lib/services/groqService.ts` — reusable Groq client with
   - lazy initialization (singleton client)
   - automatic fallback to Z-AI Web Dev SDK when Groq returns an error
   - 15-second cooldown after a failure to avoid hammering an unreachable API
   - robust JSON extraction (strips markdown fences + trailing prose)
   - `groqChat()` alias used by `src/lib/ai.ts`'s `chat()` wrapper
2. `src/lib/prompts/index.ts` — every agent system prompt lives here, separate
   from agent logic. Tunable without touching agent code.
3. `src/lib/agents/index.ts` — each agent calls `chat()` (which routes through
   Groq first, then ZAI, then heuristics). Each agent returns a structured
   JSON result with `reasons` and `matchScore` for UI rendering.
4. `src/app/api/groq/health/route.ts` — health-check endpoint polled by the
   dashboard's `GroqStatusBadge` so users know whether they're on Groq or
   the fallback.

### Switching to gemma-3-27b-it

Edit `.env`:

```bash
GROQ_MODEL=gemma-3-27b-it
NEXT_PUBLIC_GROQ_MODEL_LABEL=Groq gemma-3-27b-it
```

No code changes required — the agent prompts and SDK calls work identically
across both models.

---

## 🛡️ AI Principle

The AI in ResQNet **NEVER diagnoses** and never makes autonomous medical
decisions. The flow is always:

```
AI Recommendation → Human Review → Confirm → Execute
```

Every AI output displays this disclaimer:

> "ResQNet provides recommendations only and is not a substitute for
> professional medical advice."

The **Human Approval Gate** component enforces this principle in the UI:
the emergency plan starts with `status: "draft"` and stays there until the
user explicitly clicks **Approve Plan**. Only then does the ambulance
dispatch.

---

## ☁️ Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add environment variables (matches `vercel.json`):
   - `GROQ_API_KEY` (secret)
   - `GROQ_MODEL` (default: `llama-3.3-70b-versatile`)
   - `NEXT_PUBLIC_GROQ_MODEL_LABEL` (public)
   - `MONGODB_URI` (secret)
   - `JWT_SECRET` (secret)
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)
4. Deploy.

### Backend → Render

1. Create a new Web Service from your GitHub repo.
2. Render will auto-detect `render.yaml`.
3. Set the same environment variables in the Render dashboard.
4. Deploy.

> The WebSocket mini-service (`mini-services/ambulance-tracker`) is started
> automatically alongside the Next.js server by `render.yaml`'s
> `startCommand`.

### Database → MongoDB Atlas

1. Create a free M0 cluster at https://cloud.mongodb.com.
2. Create a database user.
3. Whitelist your IP (or `0.0.0.0/0` for demo).
4. Create a `ResQNet` database.
5. Copy the connection string into `MONGODB_URI`.

---

## 🎨 Design System

- **Primary**: Sky-600 (#1e6fdc) — medical blue
- **Accent**: Red-600 (emergency), Emerald-600 (available), Amber-600 (warning)
- **Background**: White / Slate-50
- **Typography**: Inter (body), Plus Jakarta Sans (headings)
- **Radius**: 12px cards, 8px buttons, 16px modals
- **Shadow**: Soft, low-saturation `shadow-sm` defaults

---

## 📜 License

MIT — see `LICENSE`.

---

## 🙏 Acknowledgements

Built with Next.js 16, Tailwind CSS 4, shadcn/ui, MongoDB Atlas, Socket.IO,
Groq SDK (llama-3.3-70b-versatile), Z-AI Web Dev SDK (fallback), Framer
Motion, and the entire open-source community.
