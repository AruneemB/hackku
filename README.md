<p align="center">
  <img src="public/lockey-icon.png" alt="Lockey mascot" width="120">
</p>

<h1 align="center">Lockey</h1>

<p align="center">
  <em>Your trip, handled.</em><br>
  <em>From planning to post-trip, we've got you.</em>
</p>

**An AI-powered corporate travel concierge built for the modern enterprise.** Lockey combines Google Gemini 1.5 Pro, MongoDB Atlas Vector Search, and a real-time crisis engine to guide business travelers through the entire trip lifecycle — surfacing policy violations before they happen, drafting manager approval emails, and automatically rebooking disrupted flights, all through a conversational 2D mascot.

---

## The Problem

Corporate travel is a bureaucratic maze. Employees waste hours comparing flights and hotels against policy caps, chasing manager approvals over email, and scrambling to rebook when flights are delayed. Expense reports become a post-trip nightmare of lost receipts and unclear reimbursement rules.

Existing tools give travelers a booking interface. None give them an intelligent companion that *understands* company policy, anticipates problems, and handles the paperwork autonomously.

## Our Solution

Lockey bridges this gap with three core ideas:

**Policy-aware planning.** Every flight and hotel recommendation is filtered through a vector search index of the corporate travel handbook. Lockey flags over-budget hotels, missing visas, and CEO-approval requirements *before* the traveler selects anything — not after the manager rejects it.

**Automated approvals.** Rather than sending a wall-of-text email, Lockey uses Gemini to draft a structured approval request with flight details, hotel rationale, and compliance flags. The manager replies "APPROVED" or "REJECTED" in plain English — Lockey parses the reply and recovers automatically if rejected.

**Proactive crisis management.** When a flight is delayed, Lockey doesn't wait for the traveler to notice. It detects the disruption via a MongoDB TimeSeries collection, finds the next available alternative, calculates the cost delta, and drafts an exception request to the manager — all before the traveler has left the departure gate.

---

## How It Works

```
                         ┌─────────────────────────────────┐
                         │          FRAME 1: ONBOARDING    │
                         │                                 │
                         │  1. Google OAuth sign-in        │
                         │  2. Passport expiry check       │
                         │     └─► 6-month Schengen rule   │
                         │  3. Trip details collected      │
                         │     • Destination & dates       │
                         │     • Budget cap                │
                         │                                 │
                         └──────────────┬──────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────────┐
                         │       FRAMES 2-3: SEARCH        │
                         │                                 │
                         │  Fair Grid Flight Search        │
                         │     └─► ±5 day date window      │
                         │     └─► ±100 mi airport radius  │
                         │     └─► Saturday-night savings  │
                         │                                 │
                         │  Geo-aware Hotel Search         │
                         │     └─► $geoNear MongoDB query  │
                         │     └─► Policy cap filtering    │
                         │     └─► Preferred vendor badges │
                         │                                 │
                         └──────────────┬──────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────┐
│                   FRAME 4: POLICY & COMPLIANCE                │
│                                                               │
│   Travel handbook embedded with text-embedding-004            │
│   ┌──────────────┐   vector query   ┌──────────────────────┐  │
│   │ Trip Details │─────────────────►│ Atlas Vector Search  │  │
│   └──────────────┘                  └──────────┬───────────┘  │
│                                               │               │
│                         Relevant policy chunks returned       │
│                                               │               │
│                              ┌────────────────▼───────────┐   │
│                              │  Gemini synthesizes flags   │   │
│                              │  • hotel_over_cap           │   │
│                              │  • requires_visa            │   │
│                              │  • requires_ceo_approval    │   │
│                              └────────────────────────────┘   │
└──────────────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │     FRAME 5: BUNDLE SELECTION    │
                    │                                  │
                    │  Option A — Standard             │
                    │  Option B — Savings              │
                    │  Option C — Strategic value-add  │
                    │                                  │
                    │  Gemini explains each tradeoff   │
                    │  in plain English                │
                    └──────────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │     FRAME 6: APPROVAL EMAIL      │
                    │                                  │
                    │  Gemini drafts structured email  │
                    │  with flight, hotel, and flags   │
                    │     └─► Sent via Gmail API       │
                    │                                  │
                    │  Poll for manager reply          │
                    │     └─► Gemini parses response   │
                    │     └─► APPROVED or REJECTED     │
                    └──────────────┬───────────────────┘
                                   │
                         ┌─────────┴──────────┐
                         │                    │
                      APPROVED            REJECTED
                         │                    │
                         ▼                    ▼
              ┌────────────────┐  ┌───────────────────────┐
              │  FRAME 8-9:   │  │ REJECTION RECOVERY    │
              │  TRIP ACTIVE  │  │                       │
              │               │  │ Auto-find compliant   │
              │  MongoDB       │  │ bundle within caps    │
              │  status →      │  │ Re-submit for         │
              │  "active"      │  │ approval              │
              └───────┬────────┘  └───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │     FRAMES 10-11: CRISIS ENGINE     │
        │                                     │
        │  TimeSeries collection monitors     │
        │  flight status in real time         │
        │                                     │
        │  On delay / cancellation:           │
        │  ┌──────────────────────────────┐   │
        │  │ Find next available flight   │   │
        │  │ Calculate cost delta         │   │
        │  │ Draft exception request      │   │
        │  │ Lockey shifts to urgent tone │   │
        │  └──────────────────────────────┘   │
        └────────────────┬────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │    FRAME 12: ON-GROUND SUPPORT      │
        │                                     │
        │  Airport → hotel distance computed  │
        │  Transport mode recommended:        │
        │  Walk / Rideshare / Company car     │
        │  Uber deep link with coordinates   │
        └────────────────┬────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │    FRAME 15: EXPENSE REPORTING      │
        │                                     │
        │  Camera / file upload               │
        │     └─► Gemini 1.5 Pro vision       │
        │     └─► Extract merchant, amount,   │
        │         currency, date              │
        │     └─► PII anonymized              │
        │     └─► Currency → USD              │
        │  Saved to MongoDB, filed to trip    │
        └─────────────────────────────────────┘
```

---

## Technology Stack

### Next.js 16 / TypeScript (Full-Stack)
The app runs on Next.js App Router, using server components for data fetching and client components for the mascot, real-time polling, and interactive UI frames. TypeScript enforces type safety across all 40+ API routes and shared types.

### Google Gemini 1.5 Pro (AI Engine)
Gemini powers five distinct tasks: approval email drafting, manager reply parsing, compliance flag synthesis, receipt data extraction, and match rationale generation. The multimodal vision API handles receipt images from any angle or lighting condition.

### MongoDB Atlas (Data Layer)
Three specialized Atlas features power Lockey's intelligence:
- **Vector Search** — the travel handbook is embedded and queried for RAG-based compliance checks
- **GeoJSON + $geoNear** — hotel search is anchored to office coordinates from `preferred-vendors.json`
- **TimeSeries collections** — flight status updates are stored as time series for real-time delay detection

### ElevenLabs TTS (Mascot Voice)
Lockey speaks with four emotional tones mapped to distinct ElevenLabs voice IDs: neutral (planning), excited (approval), empathetic (rejection or delay), and urgent (crisis). The mascot's facial expression and speech bubble update together.

### NextAuth.js + Google OAuth 2.0
Authentication uses Google Sign-In. The OAuth access token is persisted in the session and used directly to call the Gmail API — no intermediate token storage, no additional backend auth layer.

### SerpAPI / OpenWeatherMap / Gmail API
- **SerpAPI** — Google Flights results with real pricing and availability
- **OpenWeatherMap** — destination forecast shown during compliance check
- **Gmail API** — approval emails sent from the traveler's own account; manager replies polled every 5 seconds

---

## Project Structure

```
hackku/
├── data/
│   ├── policy/
│   │   ├── budget-caps.json          # City hotel caps and office coordinates
│   │   └── travel-handbook.md        # Source for vector search embeddings
│   ├── vendors/
│   │   └── preferred-vendors.json    # GeoJSON preferred hotel points
│   └── visa/
│       └── visa-requirements.json    # Visa data by country
├── src/
│   ├── app/
│   │   ├── api/                      # 40+ API routes
│   │   ├── scenario/page.tsx         # Scenario phone UI
│   │   ├── trip/[id]/                # Trip hub routes (live, planning, post-trip)
│   │   └── page.tsx                  # Main demo flow (15 frames)
│   ├── components/
│   │   ├── approval/                 # ApprovalStatus, RejectionRecovery
│   │   ├── flights/                  # FlightCard, FlightGrid
│   │   ├── hotels/                   # HotelCard, HotelMap
│   │   ├── mascot/                   # Mascot, SpeechBubble, ToneIndicator
│   │   ├── receipts/                 # ReceiptScanner, DemoReceiptCapture
│   │   └── trip/                     # TripChecklist, TripSummary
│   ├── hooks/
│   │   ├── useMascot.ts              # Tone + speech management
│   │   └── useTrip.ts                # Trip fetch and refresh
│   ├── lib/
│   │   ├── flights/fairGrid.ts       # Fair Grid search algorithm
│   │   ├── gemini/                   # Gemini client, prompts, multimodal
│   │   ├── google/gmail.ts           # Gmail send + approval parsing
│   │   ├── hotels/                   # Geo-aware hotel search
│   │   ├── mongodb/                  # Client, models (Trip, User, Policy…)
│   │   └── policy/vectorSearch.ts    # RAG against travel handbook
│   └── types/                        # Shared TypeScript interfaces
├── scripts/
│   ├── seed-mongodb.ts               # Populate initial data
│   └── create-vector-index.ts        # Atlas Vector Search index setup
└── tests/                            # Vitest test suite
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas cluster (Free Tier works)
- API keys: Google AI Studio, ElevenLabs, SerpAPI, OpenWeatherMap, Google Cloud Console

### Setup

1. **Clone & install**
   ```bash
   git clone https://github.com/AruneemB/hackku.git
   cd hackku
   npm install
   ```

2. **Environment configuration** — create `.env.local`:
   ```env
   MONGODB_URI=your_mongodb_uri
   NEXTAUTH_SECRET=your_secret
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   GEMINI_API_KEY=your_gemini_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ELEVENLABS_VOICE_ID=your_voice_id
   SERPAPI_KEY=your_serpapi_key
   OPENWEATHERMAP_KEY=your_openweathermap_key
   MANAGER_EMAIL=manager@yourcompany.com
   ```

3. **Seed the database**
   ```bash
   npm run seed          # Hotels, policies, vendors, visa data
   npm run create-index  # Atlas Vector Search index
   ```

4. **Run**
   ```bash
   npm run dev
   ```

---

## Future Directions

- **Multi-destination trips.** Chain approval and crisis logic across legs of a complex itinerary (e.g. NYC → London → Milan → home).
- **Calendar integration.** Pull meeting schedules from Google Calendar to auto-suggest flight windows that avoid back-to-back conflicts.
- **Expense forecasting.** Before the trip, predict total spend based on historical receipts from similar destinations and flag likely overages.
- **Manager dashboard.** A lightweight approval portal so managers can approve, reject, or comment without leaving their email client.
- **Offline mode.** Cache trip details, policy rules, and hotel info for areas with poor connectivity (airports, international transit).

---

*Built at HackKU 2026.*
