// ============================================================
// API ROUTE: Trip Flight Search
// OWNER: Track C (Data & Integrations)
// ROUTE: POST /api/trips/[id]/flights
// DESCRIPTION: Triggers the Fair Grid flight search for the
//   trip's destination and dates. Saves results to trip.flights[].
//   The planning page polls this while showing FlightSearchStatus.
//
// REQUEST: (no body needed — reads trip from DB)
//
// RESPONSE (200):
// {
//   "flights": [
//     { "id": "serp_aa2345_mci_mxp_0914", "priceUsd": 1240,
//       "saturdayNightSavingsUsd": 180, "originAirport": "MCI" },
//     { "id": "serp_dl890_mci_mxp_0913", "priceUsd": 1060,
//       "saturdayNightSavingsUsd": 0, "originAirport": "MCI" }
//   ],
//   "searchedAirports": ["MCI", "MKC"],
//   "windowDays": 5
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { runFairGrid } from "@/lib/flights/fairGrid"
// TODO: import Trip from "@/lib/mongodb/models/Trip"

// TODO: export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   // 1. Load trip from DB
//   // 2. runFairGrid({ homeAirport, destination, departure, return })
//   // 3. PATCH trip.flights = results
//   // 4. Return results
// }

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "scaffold" });
}

export async function POST() {
  return NextResponse.json({ message: "scaffold" });
}
