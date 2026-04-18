# AI Travel Concierge — HackKU

An AI-powered corporate travel assistant built for HackKU. A 2D mascot guides "Kelli," a corporate traveler, through the entire travel lifecycle — from booking and approvals to live disruption handling and post-trip expense reporting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB Atlas (Vector Search, GeoJSON, TimeSeries, Triggers) |
| AI | Google Gemini 1.5 Pro (text + multimodal vision) |
| Voice | ElevenLabs TTS (4 emotional tones) |
| Auth | NextAuth.js + Google OAuth |
| Flight Search | SerpAPI (Google Flights) |
| Weather | OpenWeatherMap |

---

## Team Track Split (3 People)

| Track | Focus | Files |
|---|---|---|
| **Track A — Frontend & UX** | All pages, all components, mascot UI, useMascot hook | `src/app/**`, `src/components/**`, `src/hooks/useMascot.ts` |
| **Track B — AI & Intelligence** | Gemini, ElevenLabs, vector search, receipt scanning, bundles, crisis | `src/lib/gemini/**`, `src/lib/elevenlabs/**`, `src/lib/policy/**` |
| **Track C — Data & Integrations** | MongoDB, seed scripts, flight/hotel APIs, Gmail, TimeSeries, Atlas Triggers | `src/lib/mongodb/**`, `src/lib/flights/**`, `src/lib/hotels/**`, `src/lib/google/**`, `scripts/**` |

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Copy env template and fill in API keys
cp .env.example .env.local

# 3. Seed MongoDB Atlas (requires MONGODB_URI + GEMINI_API_KEY in .env.local)
npx ts-node scripts/seed-mongodb.ts

# 4. Create Atlas Vector Search index on policies collection
npx ts-node scripts/create-vector-index.ts
# OR create manually in Atlas UI (see scripts/create-vector-index.ts for instructions)

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Implementation Steps (1–17)

### Step 1 — Environment Setup
**Owner: All / Track A leads**
Initialize the project, install all dependencies, configure `.env.local` with real API keys.
All teammates must have a working dev environment before other steps begin.

Key dependencies: `next`, `typescript`, `tailwindcss`, `mongodb`, `mongoose`, `next-auth`, `@google/generative-ai`, `@elevenlabs/elevenlabs-js`, `serpapi`

---

### Step 2 — TypeScript Types (Shared Contract)
**Owner: Track B**
`src/types/*.ts` — Define all interfaces before any implementation begins.
This is the team contract that allows parallel development. No teammate should write a function without first checking the type for its input/output.

Key types: `User`, `Trip` (polymorphic), `Flight`, `Hotel`, `Policy`, `PolicyFindings`, `Receipt`

---

### Step 3 — MongoDB Atlas Setup
**Owner: Track C**
- Create Atlas cluster (free tier M0 is fine for the demo)
- Enable network access (allow all IPs: 0.0.0.0/0 for hackathon)
- Create 2dsphere index on `preferred_vendors.location` (for hotel geo search)
- Create Vector Search index on `policies.embedding` (dimension: 768, cosine)
- Create TimeSeries collection `flight_status`

Atlas UI: Database → Browse Collections → Create Index / Search Indexes

---

### Step 4 — Seed MongoDB
**Owner: Track C**
`scripts/seed-mongodb.ts` — Run after Atlas is configured.

Seeds:
- `users`: Kelli Thompson (passport expiring soon!) + manager
- `policies`: 6 cities with Gemini-generated embeddings
- `preferred_vendors`: 9 GeoJSON hotels across 6 cities
- `visa_requirements`: US citizen rules for IT, GB, FR, JP, CA, MX
- `trips`: Demo trip (Kelli → Milan, draft status)

---

### Step 5 — NextAuth + Google OAuth
**Owner: Track C**
`src/app/api/auth/[...nextauth]/route.ts`, `src/lib/google/oauth.ts`

Configure Google provider with Gmail scopes (`gmail.compose`, `gmail.readonly`).
Store `access_token` + `refresh_token` in the JWT session for Gmail API calls.

---

### Step 6 — MongoDB Client + Models
**Owner: Track C**
`src/lib/mongodb/client.ts` — Connection singleton.
`src/lib/mongodb/models/*.ts` — Mongoose schemas for User, Trip, Policy, PreferredVendor, VisaRequirement, FlightStatus.

---

### Step 7 — Mascot Component + ElevenLabs
**Owner: Track A (component) + Track B (TTS client)**
`src/components/mascot/Mascot.tsx` — Placeholder image + SpeechBubble overlay.
`src/lib/elevenlabs/client.ts` — `speak(text, tone)` returns audio stream.
`src/hooks/useMascot.ts` — Central state: `say()`, `tone`, `isSpeaking`.

4 tones: `neutral`, `excited`, `empathetic`, `urgent` (see `tones.ts`).

---

### Step 8 — Gemini AI Client + Prompts
**Owner: Track B**
`src/lib/gemini/client.ts` — Initialize `gemini-1.5-pro` + `text-embedding-004`.
`src/lib/gemini/prompts.ts` — All prompt templates (bundle ranking, packing list, policy summary, crisis message, expense report).

All prompts should request JSON output for reliable parsing.

---

### Step 9 — Flight Search (Fair Grid Algorithm)
**Owner: Track C**
`src/lib/flights/fairGrid.ts` — Searches all airports within 100 miles × 5-day window.
`src/lib/flights/airports.ts` — Haversine distance for airport expansion.
`src/lib/flights/search.ts` — SerpAPI Google Flights wrapper.

Fair Grid formula: `airports × date_window` combinations, sorted by price, with Saturday-night savings calculated per result.

---

### Step 10 — Hotel Geo Search
**Owner: Track C**
`src/lib/hotels/geoSearch.ts` — MongoDB `$geoNear` aggregation (requires 2dsphere index).
`src/lib/hotels/search.ts` — Hotel search API wrapper (SerpAPI or preferred vendors).

Results are cross-referenced with the `preferred_vendors` collection and policy cap.

---

### Step 11 — Policy + Visa Vector Search
**Owner: Track B (vector) + Track C (visa lookup)**
`src/lib/policy/vectorSearch.ts` — Generate query embedding → Atlas `$vectorSearch` → Gemini synthesizes `PolicyFindings`.
`/api/visa/check` — Simple DB lookup against `visa_requirements`.

---

### Step 12 — Bundle Generation + Selection UI
**Owner: Track B (Gemini ranking) + Track A (BundleSelector UI)**
`/api/trips/[id]/bundles` — Gemini analyzes flights + hotels → returns 3 ranked bundles.

Bundle A = standard compliance route.
Bundle B = alternative airport or hotel to save ~$500.
Bundle C = Saturday-night stay strategy to upgrade hotel within budget.

---

### Step 13 — Gmail Approval + Atlas Trigger
**Owner: Track C**
`src/lib/google/gmail.ts` — Draft + send approval email with trip rationale.
`/api/trips/[id]/approve` — Sends email, updates trip to `pending_approval`, stores `gmailThreadId`.
`/api/webhooks/gmail-approval` — Called when manager replies (via polling or Atlas Trigger).

For the hackathon: polling Gmail every 30 seconds is simpler than a true Atlas Trigger.

---

### Step 14 — Receipt Scanning (Gemini Multimodal)
**Owner: Track B (vision) + Track A (camera UI)**
`src/lib/gemini/multimodal.ts` — Send base64 image to Gemini 1.5 Pro, get merchant/amount/date back.
`src/lib/utils/pii.ts` — Strip credit card numbers before saving.
`src/lib/utils/currency.ts` — Convert to USD, store as MongoDB `Decimal128`.

---

### Step 15 — Live Mode Dashboard + TimeSeries
**Owner: Track C (data) + Track A (UI)**
`src/lib/mongodb/models/FlightStatus.ts` — TimeSeries read/write helpers.
`/api/flights/live` — GET latest status; POST to inject demo delay.
`src/hooks/useFlightStatus.ts` — Polls every 30s, triggers crisis state.
`src/components/travel/LiveDashboard.tsx` — Gate, status, weather, hotel check-in.

---

### Step 16 — Crisis Detection + Rebooking
**Owner: Track B (AI logic) + Track A (CrisisAlert UI)**
`src/components/travel/CrisisAlert.tsx` — Full-screen alert with alternative flight.
Crisis triggers when `delayMinutes` > connection buffer.
If rebooking is over budget → Gemini drafts exception request email automatically.

---

### Step 17 — Post-Trip Closure + Expense Report
**Owner: Track B (Gemini draft) + Track C (Gmail scan) + Track A (UI)**
Gmail scan for missed receipts → Gemini extracts → appended to trip.
Gemini generates expense report draft.
Trip status updated to `archived`.
Privacy summary screen (Frame 16) displayed.

---

## MongoDB Collections

| Collection | Type | Purpose |
|---|---|---|
| `users` | Standard | Kelli's profile + passport |
| `trips` | Standard (Polymorphic) | Core document, status drives all UI |
| `policies` | Standard + Vector Search | Budget caps + embedded handbook text |
| `preferred_vendors` | Standard + 2dsphere | GeoJSON hotel locations |
| `visa_requirements` | Standard | Hardcoded lookup for 6 demo countries |
| `flight_status` | TimeSeries | Live flight updates (Frame 9-11) |

---

## Demo Countries Supported

IT (Italy) · GB (United Kingdom) · FR (France) · JP (Japan) · CA (Canada) · MX (Mexico)

All six require no visa for US citizens — simplifies the demo. Visa requirements are still seeded and looked up via vector search to demonstrate the capability.

---

## Demo Test Path (End-to-End)

1. Sign in with Google OAuth
2. Enter **Milan, Italy** + Sep 14-19 dates
3. Passport warning fires (Kelli's expires Mar 2026 — within 6 months)
4. Flight search runs → Fair Grid shows 3 results across MCI airports
5. Hotel geo search → Marriott (preferred, 0.8km) appears with map
6. Policy summary: no visa, hotel $185 = within $200 cap ✅
7. Select **Bundle B** (saves $500 via Bergamo airport)
8. Gmail approval email sent → "Waiting for manager..."
9. Manager approves → mascot tone shifts to **Excited**
10. Checklist: packing list from Milan weather forecast
11. **LIVE MODE**: Gate B22, on-time, 22°C in Milan
12. **DEMO TRIGGER**: POST `/api/flights/live` → inject 47-min delay
13. CrisisAlert fires → mascot warns, alternative flight shown
14. On ground: hotel address, $75/day meal allowance, office quick-dial
15. Post-trip: photograph restaurant receipt → Gemini extracts €43.50 → $47.23 USD
16. Expense summary: $1,157.50 total vs $2,800 budget
17. Archive trip → privacy summary screen

---

## File Structure (High Level)

```
hackku/
├── data/              ← hardcoded seed data (committed to repo)
│   ├── policy/        ← travel-handbook.md, budget-caps.json
│   ├── vendors/       ← preferred-vendors.json (GeoJSON)
│   └── visa/          ← visa-requirements.json (6 countries)
├── scripts/           ← seed-mongodb.ts, create-vector-index.ts
├── public/mascot/     ← mascot placeholder image
└── src/
    ├── types/         ← shared TypeScript interfaces (start here!)
    ├── lib/           ← all integrations (mongodb, gemini, elevenlabs, flights, hotels, etc.)
    ├── hooks/         ← useMascot, useTrip, useFlightStatus, useLiveTracking
    ├── components/    ← mascot/, trip/, flights/, hotels/, policy/, approval/, travel/, receipts/, ui/
    └── app/           ← Next.js App Router pages + API routes
        ├── page.tsx   ← Frame 1: landing
        ├── trip/[id]/planning/   ← Frames 2-5
        ├── trip/[id]/approval/   ← Frames 6-7
        ├── trip/[id]/checklist/  ← Frame 8
        ├── trip/[id]/live/       ← Frames 9-12
        └── trip/[id]/post-trip/  ← Frames 13-16
```

---

## Environment Variables

Copy `.env.example` to `.env.local`. Required keys:

- `MONGODB_URI` — Atlas connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google Cloud Console
- `GEMINI_API_KEY` — Google AI Studio
- `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` — ElevenLabs dashboard
- `SERPAPI_KEY` — SerpAPI (Google Flights wrapper)
- `OPENWEATHERMAP_KEY` — OpenWeatherMap free tier
