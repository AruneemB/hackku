// ============================================================
// LIB: Fair Grid Algorithm (Frame 2)
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Implements the "Fair Grid" search strategy:
//   1. Expand airports: find all airports within 100mi of home
//   2. Search each airport × 5-day window (±2 days from target)
//   3. For each result, calculate Saturday-night stay savings
//   4. Return all results sorted by priceUsd ascending
//
// "Saturday night stay" means the return flight is after
//   Saturday night — airlines charge less for these itineraries.
//   The delta is stored on the Flight object for display.
//
// USAGE:
//   const results = await runFairGrid({
//     homeAirport: "MCI", destination: "MXP",
//     targetDeparture: new Date("2025-09-14"),
//     targetReturn: new Date("2025-09-19")
//   })
// ============================================================

// TODO: import { searchFlights } from "./search"
// TODO: import { getAirportsWithinRadius } from "./airports"
// TODO: import type { Flight } from "@/types"

// TODO: interface FairGridParams {
//   homeAirport: string;
//   destination: string;
//   targetDeparture: Date;
//   targetReturn: Date;
//   windowDays?: number;   // default: 5 (±2 days each side)
//   radiusMiles?: number;  // default: 100
// }

// TODO: export async function runFairGrid(params: FairGridParams): Promise<Flight[]> {
//   // Step 1: expand airports
//   // const airports = await getAirportsWithinRadius(params.homeAirport, params.radiusMiles ?? 100)
//
//   // Step 2: build date window (targetDeparture ± windowDays/2)
//   // const dates = buildDateWindow(params.targetDeparture, params.windowDays ?? 5)
//
//   // Step 3: search all combinations in parallel
//   // const promises = airports.flatMap(airport =>
//   //   dates.map(date => searchFlights({ origin: airport, destination: params.destination, date }))
//   // )
//   // const allResults = (await Promise.all(promises)).flat()
//
//   // Step 4: calculate Sat-night delta for each result
//   // Step 5: sort by price, return
//
//   // EXAMPLE RETURN (2 results from a 5-airport × 5-day grid):
//   // [
//   //   { priceUsd: 1060, originAirport: "MCI", saturdayNightSavingsUsd: 180 },
//   //   { priceUsd: 1240, originAirport: "MCI", saturdayNightSavingsUsd: 0 },
//   //   { priceUsd: 1310, originAirport: "STL", saturdayNightSavingsUsd: 220 }
//   // ]
// }

// TODO: function buildDateWindow(target: Date, days: number): string[] {
//   // Returns array of YYYY-MM-DD strings ±days/2 around target
// }
