// ============================================================
// LIB: Gemini Prompt Templates
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: All Gemini prompt strings live here. Keeping
//   prompts centralized makes tuning easier without touching
//   business logic. Each function returns a string prompt
//   or a chat history array for multi-turn scenarios.
// ============================================================

// TODO: export function buildPassportWarningPrompt(expiryDate: Date, destination: string) {
//   // Returns: "Kelli, heads up — your passport expires on [date], which is
//   //   within 6 months of your planned trip to [destination].
//   //   You'll need to renew it before you can travel. Should I continue
//   //   planning your trip while you sort that out?"
// }

// TODO: export function buildFlightSearchStatusPrompt(destination: string) {
//   // Frame 2 — mascot narrates while search runs
//   // Returns: "I'm checking all airports within 100 miles of Kansas City
//   //   and scanning a 5-day window around your dates to find the best fares..."
// }

// TODO: export function buildBundleRankingPrompt(flights: Flight[], hotels: Hotel[], policy: Policy) {
//   // Asks Gemini to rank and group into 3 bundles (A=standard, B=value, C=strategic)
//   // EXAMPLE RETURN from Gemini (parsed as JSON):
//   // [
//   //   { "label": "A", "description": "Direct flight + Marriott Milan. Full compliance.",
//   //     "flightId": "...", "hotelId": "...", "totalCostUsd": 2480, "savingsVsStandard": 0 },
//   //   { "label": "B", "description": "Fly via Bergamo (BGY) + NH Milano. Saves $500.",
//   //     "flightId": "...", "hotelId": "...", "totalCostUsd": 1980, "savingsVsStandard": 500 },
//   //   { "label": "C", "description": "Sat-night stay reduces airfare enough to upgrade hotel.",
//   //     "flightId": "...", "hotelId": "...", "totalCostUsd": 2100, "savingsVsStandard": 380 }
//   // ]
// }

export function buildPolicySummaryPrompt(policyDoc: any, trip: any) {
  return `You are a travel policy expert and helpful AI mascot. 
Based on the company travel policy excerpt and the user's trip details below, generate a PolicyFindings JSON object.

Trip Details:
- Destination: ${trip.destination.city}, ${trip.destination.country}
- Dates: ${trip.dates.departure} to ${trip.dates.return}

Policy Excerpt:
${policyDoc.handbookExcerpt}

Policy Budget Caps:
- Hotel Nightly Cap: $${policyDoc.hotelNightlyCapUsd}
- Flight Cap: $${policyDoc.flightCapUsd}
- Meal Allowance: $${policyDoc.mealAllowancePerDayUsd} per day

Return ONLY a JSON object matching this structure:
{
  "visa": {
    "destinationCountry": "string (ISO 2-letter code)",
    "citizenship": "string (e.g. US)",
    "visaRequired": boolean,
    "visaType": "string | null",
    "stayLimitDays": number,
    "notes": "string",
    "applicationUrl": "string | null"
  },
  "hotelNightlyCapUsd": number,
  "flightCapUsd": number,
  "mealAllowancePerDayUsd": number,
  "requiresManagerApproval": boolean,
  "approvalReason": "string | null",
  "mascotSummary": "A friendly summary of the findings, including visa status and whether the trip is in compliance."
}

Ensure the JSON is valid and includes all fields.`;
}

// TODO: export function buildCrisisPrompt(delayMinutes: number, alternativeFlights: Flight[]) {
//   // Frame 10 — empathetic tone, explains disruption + next steps
// }

// TODO: export function buildExceptionRequestPrompt(trip: Trip, overageUsd: number) {
//   // Frame 11 — drafts a manager email explaining why over-budget rebooking was needed
// }

// TODO: export function buildExpenseReportPrompt(trip: Trip) {
//   // Frame 15 — summarizes spend vs budget, lists receipts by category
// }

// TODO: export function buildPackingListPrompt(destination: string, weatherForecast: WeatherForecast) {
//   // Frame 8 — generates packing list based on destination + weather
//   // EXAMPLE RETURN from Gemini:
//   // ["Umbrella (rain forecast Wed-Thu)", "Light jacket", "Business attire x4",
//   //  "Power adapter (Type C/F for Italy)", "Comfortable walking shoes"]
// }
