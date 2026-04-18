// ============================================================
// API ROUTE: Bundle Generation (Gemini-ranked)
// OWNER: Track B (AI & Intelligence)
// ROUTE: GET /api/trips/[id]/bundles
// DESCRIPTION: Asks Gemini to analyze trip.flights[] and
//   trip.hotels[] and rank them into 3 integrated bundles:
//   A = standard compliance, B = value/savings, C = strategic.
//
// QUERY PARAMS:
//   maxHotelNightlyUsd?: number  (for rejection recovery — constrain hotel cap)
//
// RESPONSE (200):
// {
//   "bundles": [
//     { "label": "A", "description": "Direct MCI→MXP + Marriott Milan. Full compliance.",
//       "totalCostUsd": 2480, "savingsVsStandard": 0, "complianceFlags": [] },
//     { "label": "B", "description": "Fly via BGY + NH Milano. Saves $500 vs standard.",
//       "totalCostUsd": 1980, "savingsVsStandard": 500, "complianceFlags": [] },
//     { "label": "C", "description": "Sat-night stay cuts airfare enough to upgrade hotel.",
//       "totalCostUsd": 2100, "savingsVsStandard": 380, "complianceFlags": [] }
//   ]
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { buildBundleRankingPrompt } from "@/lib/gemini/prompts"
// TODO: import { geminiModel } from "@/lib/gemini/client"

// TODO: export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   // 1. Load trip (with flights, hotels, policyFindings) from DB
//   // 2. buildBundleRankingPrompt(flights, hotels, policyFindings)
//   // 3. Parse Gemini JSON response into TripBundle[]
//   // 4. Return bundles
// }

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "scaffold" });
}

export async function POST() {
  return NextResponse.json({ message: "scaffold" });
}
