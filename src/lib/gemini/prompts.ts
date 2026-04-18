// ============================================================
// LIB: Gemini Prompt Templates
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: All Gemini prompt strings live here. Keeping
//   prompts centralized makes tuning easier without touching
//   business logic. Each function returns a prompt string to
//   pass to geminiModel.generateContent(). Prompts that expect
//   structured data request JSON-only output so callers can
//   JSON.parse() the response without extra handling.
//
//   Model: gemini-2.5-flash (see client.ts)
// ============================================================

import type { Flight, Hotel, Policy, PolicyFindings, Trip, WeatherForecast } from "@/types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function flightSummary(f: Flight): string {
  return JSON.stringify({
    id: f.id,
    route: `${f.outbound.origin}→${f.outbound.destination}`,
    carrier: `${f.outbound.carrier} ${f.outbound.flightNumber}`,
    departs: fmtDate(f.outbound.departureTime),
    priceUsd: f.priceUsd,
    saturdayNightStay: f.saturdayNightStay,
    saturdayNightSavingsUsd: f.saturdayNightSavingsUsd,
  })
}

function hotelSummary(h: Hotel): string {
  return JSON.stringify({
    id: h.id,
    name: h.name,
    distanceKm: h.distanceFromOfficeKm,
    nightlyRateUsd: h.nightlyRateUsd,
    totalCostUsd: h.totalCostUsd,
    preferred: h.preferred,
    overPolicyCap: h.overPolicyCap,
    amenities: h.amenities,
  })
}

// ---------------------------------------------------------------------------
// Frame 1 — Passport expiry warning (plain string, no JSON)
// ---------------------------------------------------------------------------

export function buildPassportWarningPrompt(expiryDate: Date, destination: string): string {
  const expiry = fmtDate(expiryDate)
  return `You are Kelli, a friendly AI travel concierge for a corporate traveler. \
Write a brief, warm warning message (2–3 sentences, first person as the AI assistant) \
telling the traveler their passport expires on ${expiry}, which is within 6 months \
of their planned trip to ${destination}. Advise them to renew it. \
Do NOT use JSON. Plain conversational text only.`
}

// ---------------------------------------------------------------------------
// Frame 2 — Flight search narration (plain string, no JSON)
// ---------------------------------------------------------------------------

export function buildFlightSearchStatusPrompt(destination: string): string {
  return `You are Kelli, a friendly AI travel concierge. \
Write a single short sentence (under 20 words) telling the traveler you are now \
searching flights to ${destination}, checking multiple nearby airports and a \
5-day date window for the best fares. Conversational tone. No JSON.`
}

// ---------------------------------------------------------------------------
// Frame 3/4 — Bundle ranking
// Returns JSON array of 3 bundle candidates:
// [{ label, description, flightId, hotelId, totalCostUsd, savingsVsStandard, complianceFlags }]
// ---------------------------------------------------------------------------

export function buildBundleRankingPrompt(
  flights: Flight[],
  hotels: Hotel[],
  policy: Policy
): string {
  const flightList = flights.map(flightSummary).join("\n")
  const hotelList  = hotels.map(hotelSummary).join("\n")

  return `You are a corporate travel optimization engine. \
Given the flights, hotels, and policy below, produce exactly 3 travel bundles \
(A = standard/safest, B = best value via alternative routing, C = strategic \
Saturday-night-stay upgrade). Use actual IDs from the lists provided.

POLICY:
- Hotel nightly cap: $${policy.hotelNightlyCapUsd}
- Flight cap: $${policy.flightCapUsd}
- Preferred transport: ${policy.preferredTransport.join(", ")}

FLIGHTS:
${flightList}

HOTELS:
${hotelList}

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "label": "A",
    "description": "1–2 sentence rationale",
    "flightId": "<id from list>",
    "hotelId": "<id from list>",
    "totalCostUsd": <flight price + hotel total>,
    "savingsVsStandard": 0,
    "complianceFlags": []
  },
  { "label": "B", ... },
  { "label": "C", ... }
]
complianceFlags should list any policy violations (e.g. "hotel_over_cap", "flight_over_cap").`
}

// ---------------------------------------------------------------------------
// Frame 4 — Policy findings plain-language summary (plain string, no JSON)
// The full PolicyFindings object is passed; Gemini writes mascotSummary text.
// ---------------------------------------------------------------------------

export function buildPolicySummaryPrompt(findings: PolicyFindings): string {
  const visa = findings.visa
  return `You are Kelli, a friendly AI travel concierge. \
Write a concise 2–3 sentence plain-language summary of these travel policy findings \
for the traveler. Be warm and direct. Mention visa status, hotel cap, and whether \
manager approval is needed.

FINDINGS:
- Visa required: ${visa.visaRequired} (${visa.notes})
- Hotel nightly cap: $${findings.hotelNightlyCapUsd}
- Flight cap: $${findings.flightCapUsd}
- Meal allowance: $${findings.mealAllowancePerDayUsd}/day
- Manager approval required: ${findings.requiresManagerApproval}\
${findings.approvalReason ? ` — reason: ${findings.approvalReason}` : ""}

Do NOT use JSON. Plain conversational text only.`
}

// ---------------------------------------------------------------------------
// Frame 10 — Crisis / delay alert
// Returns JSON: { message: string, urgency: "low"|"medium"|"high", suggestedAction: string }
// ---------------------------------------------------------------------------

export function buildCrisisPrompt(
  delayMinutes: number,
  alternativeFlights: Flight[]
): string {
  const altList = alternativeFlights.slice(0, 3).map(flightSummary).join("\n")

  return `You are Kelli, an AI travel concierge handling a live flight disruption. \
The traveler's flight is delayed by ${delayMinutes} minutes.

${alternativeFlights.length > 0
    ? `Alternative flights available:\n${altList}`
    : "No alternative flights are currently available."}

Return ONLY a JSON object, no markdown:
{
  "message": "<empathetic 2–3 sentence message to the traveler explaining the delay and next steps>",
  "urgency": "<low|medium|high — high if delay > 90 min or connection at risk>",
  "suggestedAction": "<one clear action: e.g. 'Rebook on AA1234 departing 17:45' or 'Proceed to gate, delay is minor'>"
}`
}

// ---------------------------------------------------------------------------
// Frame 11 — Over-budget exception request email body (plain string)
// ---------------------------------------------------------------------------

export function buildExceptionRequestPrompt(trip: Trip, overageUsd: number): string {
  const dest = trip.destination
  const dates = `${fmtDate(trip.dates.departure)} – ${fmtDate(trip.dates.return)}`

  return `Draft a short, professional email body (no subject line, no greeting headers) \
from a corporate traveler to their manager requesting approval for a travel expense \
that is $${overageUsd} over the approved budget.

TRIP DETAILS:
- Destination: ${dest.city}, ${dest.country}
- Dates: ${dates}
- Budget cap: $${trip.budgetCapUsd}
- Actual cost: $${trip.totalSpendUsd}
- Overage: $${overageUsd}

The tone should be professional, concise, and include a brief business justification. \
2–3 short paragraphs. Plain text only, no JSON.`
}

// ---------------------------------------------------------------------------
// Frame 15 — Post-trip expense report
// Returns JSON: { summary, totalSpendUsd, budgetCapUsd, underBudgetUsd,
//                 byCategory: { meal, transport, hotel, other },
//                 receipts: [{ merchant, category, amountUsd, date }],
//                 narrativeSummary }
// ---------------------------------------------------------------------------

export function buildExpenseReportPrompt(trip: Trip): string {
  const dest = trip.destination
  const dates = `${fmtDate(trip.dates.departure)} – ${fmtDate(trip.dates.return)}`
  const receipts = trip.receipts
    .map((r) =>
      `{ merchant: "${r.merchant}", category: "${r.category}", ` +
      `amountUsd: ${r.totalUsd}, date: "${fmtDate(r.date)}" }`
    )
    .join("\n")

  return `You are a corporate travel expense report generator. \
Produce a structured expense report for the following trip.

TRIP:
- Destination: ${dest.city}, ${dest.country}
- Dates: ${dates}
- Total spend: $${trip.totalSpendUsd}
- Budget cap: $${trip.budgetCapUsd}

RECEIPTS:
${receipts || "(no receipts recorded)"}

Return ONLY a JSON object, no markdown:
{
  "totalSpendUsd": <number>,
  "budgetCapUsd": <number>,
  "underBudgetUsd": <positive = under, negative = over>,
  "byCategory": {
    "meal": <total usd>,
    "transport": <total usd>,
    "hotel": <total usd>,
    "other": <total usd>
  },
  "receipts": [{ "merchant": string, "category": string, "amountUsd": number, "date": string }],
  "narrativeSummary": "<2–3 sentence plain-language summary of the trip spend>"
}`
}

// ---------------------------------------------------------------------------
// Frame 8 — Weather-based packing list
// Returns JSON string array of packing items with inline reasoning
// ---------------------------------------------------------------------------

export function buildPackingListPrompt(
  destination: string,
  forecast: WeatherForecast
): string {
  const days = forecast.days
    .map((d) => `${d.date}: ${d.condition}, ${d.tempLowC}–${d.tempHighC}°C`)
    .join("\n")

  return `You are a corporate travel assistant generating a packing list. \
The traveler is going to ${destination} on a business trip.

WEATHER FORECAST:
${days}

Generate a practical packing list tailored to the forecast and business context. \
Each item should be a short string, optionally with a brief reason in parentheses \
if non-obvious (e.g. "Umbrella (rain forecast Thu–Fri)").

Return ONLY a JSON array of strings, no markdown, no explanation. Example format:
["Business attire x4", "Umbrella (rain Wed–Thu)", "Power adapter (Type C)", "Light jacket (evenings cool)"]

Include 8–12 items. Prioritise weather-driven items first, then business essentials.`
}
