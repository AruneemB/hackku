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

import { Trip } from "@/types/trip";
import { Policy, VisaRequirement } from "@/types/policy";

export function buildPolicySummaryPrompt(
  policyDoc: Policy, 
  trip: Trip, 
  visaInfo: VisaRequirement,
  costs?: { flightCostUsd?: number; hotelNightlyRateUsd?: number }
) {
  return `You are a travel policy expert and helpful AI mascot. 
Based on the company travel policy excerpt, visa requirements, and the user's trip details below, generate a PolicyFindings JSON object.

Trip Details:
- Destination: ${trip.destination.city}, ${trip.destination.country}
- Dates: ${trip.dates.departure} to ${trip.dates.return}

${costs?.flightCostUsd ? `- Selected Flight Cost: $${costs.flightCostUsd}` : ""}
${costs?.hotelNightlyRateUsd ? `- Selected Hotel Nightly Rate: $${costs.hotelNightlyRateUsd}` : ""}

Visa Requirements for ${visaInfo.citizenship} citizen visiting ${visaInfo.destinationCountry}:
- Visa Required: ${visaInfo.visaRequired}
- Visa Type: ${visaInfo.visaType || "N/A"}
- Stay Limit: ${visaInfo.stayLimitDays} days
- Notes: ${visaInfo.notes}
${visaInfo.applicationUrl ? `- Application URL: ${visaInfo.applicationUrl}` : ""}

Policy Excerpt:
${policyDoc.handbookExcerpt}

Policy Budget Caps:
- Hotel Nightly Cap: $${policyDoc.hotelNightlyCapUsd}
- Flight Cap: $${policyDoc.flightCapUsd}
- Meal Allowance: $${policyDoc.mealAllowancePerDayUsd} per day

Return ONLY a JSON object matching this structure:
{
  "hotelNightlyCapUsd": number,
  "flightCapUsd": number,
  "mealAllowancePerDayUsd": number,
  "requiresManagerApproval": boolean,
  "approvalReason": "string | null",
  "mascotSummary": "A friendly summary of the findings, including visa status and whether the trip is in compliance."
}

Ensure the JSON is valid and includes all fields. 
If costs are provided, compare them against the policy caps to determine "requiresManagerApproval" and "approvalReason".`;
}

export function buildCrisisPrompt(delayMinutes: number, alternativeFlights: { flightNumber: string; carrier: string; departureTime: string; priceUsd: number }[]) {
  const altList = alternativeFlights.length
    ? alternativeFlights.map(f => `- ${f.carrier} ${f.flightNumber} departing ${f.departureTime} ($${f.priceUsd})`).join("\n")
    : "No alternatives currently available.";

  return `You are a helpful, empathetic AI travel concierge. Kelli's flight has been delayed by ${delayMinutes} minutes, which will cause her to miss her connection.

Compose a brief, calm reassurance message (2-3 sentences) that:
1. Acknowledges the disruption with empathy
2. Mentions you've already found alternative options
3. Ends with a confident, action-oriented statement

Available alternatives:
${altList}

Return ONLY the spoken message text — no JSON, no bullet points.`;
}

export function buildExceptionRequestPrompt(trip: { destination: { city: string; country: string }; dates: { departure: Date; return: Date }; budgetCapUsd: string; selectedBundle: { totalCostUsd: number; flight: { outbound: { flightNumber: string; carrier: string } }; hotel: { name: string; pricePerNightUsd: number } } | null }, overageUsd: number) {
  const bundle = trip.selectedBundle;
  const flightInfo = bundle ? `${bundle.flight.outbound.carrier} ${bundle.flight.outbound.flightNumber}` : "original flight";
  const hotelInfo = bundle ? `${bundle.hotel.name} ($${bundle.hotel.pricePerNightUsd}/night)` : "original hotel";

  return `Draft a professional manager exception request email for an emergency rebooking that exceeds the travel budget by $${overageUsd}.

Trip context:
- Destination: ${trip.destination.city}, ${trip.destination.country}
- Dates: ${new Date(trip.dates.departure).toDateString()} – ${new Date(trip.dates.return).toDateString()}
- Original booking: ${flightInfo} + ${hotelInfo}
- Budget cap: $${trip.budgetCapUsd}
- Overage: $${overageUsd}

The rebooking was required due to a flight delay that caused a missed connection.

Return ONLY a JSON object:
{
  "subject": "email subject line",
  "body": "full email body (plain text, 3-4 short paragraphs)"
}`;
}

// TODO: export function buildExpenseReportPrompt(trip: Trip) {
//   // Frame 15 — summarizes spend vs budget, lists receipts by category
// }

// TODO: export function buildPackingListPrompt(destination: string, weatherForecast: WeatherForecast) {
//   // Frame 8 — generates packing list based on destination + weather
//   // EXAMPLE RETURN from Gemini:
//   // ["Umbrella (rain forecast Wed-Thu)", "Light jacket", "Business attire x4",
//   //  "Power adapter (Type C/F for Italy)", "Comfortable walking shoes"]
// }
