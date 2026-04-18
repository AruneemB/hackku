// ============================================================
// API ROUTE: Policy Verification (Vector Search)
// OWNER: Track B (AI & Intelligence)
// ROUTE: POST /api/policy/verify
// DESCRIPTION: Runs Atlas Vector Search against the company
//   travel handbook and looks up visa requirements. Returns
//   PolicyFindings including Gemini's plain-language summary.
//   Called by the planning page after flight+hotel search.
//
// REQUEST BODY:
// {
//   "tripId": "665a2b3c4d5e6f7a8b9c0d1e",
//   "destination": { "city": "Milan", "country": "IT" },
//   "hotelNightlyRateUsd": 215,
//   "flightCostUsd": 1240
// }
//
// RESPONSE (200):
// {
//   "findings": {
//     "visa": { "visaRequired": false, "stayLimitDays": 90, "notes": "No visa needed." },
//     "hotelNightlyCapUsd": 200,
//     "flightCapUsd": 1500,
//     "requiresManagerApproval": true,
//     "approvalReason": "Hotel $215 exceeds $200 Milan cap",
//     "mascotSummary": "Good news — no visa needed! But hotel needs sign-off."
//   }
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { queryPolicyForTrip } from "@/lib/policy/vectorSearch"

// TODO: export async function POST(req: NextRequest) {
//   // Parse body
//   // queryPolicyForTrip(trip) → PolicyFindings
//   // PATCH trip.policyFindings = findings
//   // Return findings
// }
