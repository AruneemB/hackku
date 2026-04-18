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

// TODO: export function buildPolicySummaryPrompt(policyFindings: PolicyFindings) {
//   // Frame 4 — mascot explains visa + budget findings in plain language
// }

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
