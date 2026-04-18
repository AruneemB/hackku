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

import { searchFlights } from "./search";
import { getAirportsWithinRadius } from "./airports";
import type { Flight, FlightGroup } from "@/types/flight";

export interface FairGridParams {
  homeAirport: string;
  destination: string;
  targetDeparture: Date;
  targetReturn: Date;
  windowDays?: number;
  radiusMiles?: number;
}

/**
 * Returns an array of ISO date strings (YYYY-MM-DD) centered on the target date.
 */
export function buildDateWindow(target: Date, days: number): string[] {
  const result: string[] = [];
  const startOffset = -Math.floor(days / 2);
  
  for (let i = 0; i < days; i++) {
    const d = new Date(target.getTime());
    d.setUTCDate(d.getUTCDate() + startOffset + i);
    result.push(d.toISOString().split("T")[0]);
  }
  
  return result;
}

/**
 * Checks if the trip includes a Saturday overnight stay.
 * In airline pricing, a "Saturday night stay" means the return flight is 
 * on or after the Sunday following the departure. This typically results 
 * in lower fares for leisure travelers.
 */
function isSaturdayNightStay(departureDate: Date, returnDate: Date): boolean {
  // A Saturday-night stay means the trip spans at least one Saturday midnight:
  // the return must be strictly after the first Saturday on or after departure.
  const dep = new Date(departureDate);
  dep.setUTCHours(0, 0, 0, 0);
  const daysToSaturday = (6 - dep.getUTCDay() + 7) % 7;
  const firstSaturday = new Date(dep);
  firstSaturday.setUTCDate(dep.getUTCDate() + daysToSaturday);
  const ret = new Date(returnDate);
  ret.setUTCHours(0, 0, 0, 0);
  return ret.getTime() > firstSaturday.getTime();
}

/**
 * Runs the Fair Grid search algorithm across expanded airports and a date window.
 * Returns one FlightGroup per unique outbound flight, each with all available
 * return options sorted cheapest first.
 */
export async function runFairGrid(params: FairGridParams): Promise<FlightGroup[]> {
  const {
    homeAirport,
    destination,
    targetDeparture,
    targetReturn,
    windowDays = 5,
    radiusMiles = 100
  } = params;

  if (windowDays < 1 || windowDays > 7) {
    throw new Error("windowDays must be between 1 and 7");
  }

  if (radiusMiles < 0 || radiusMiles > 250) {
    throw new Error("radiusMiles must be between 0 and 250");
  }

  // Step 1: Expand airports
  const airports = getAirportsWithinRadius(homeAirport, radiusMiles);

  // Step 2: Build date window
  const departureDates = buildDateWindow(targetDeparture, windowDays);
  
  // Trip duration in milliseconds to keep return dates consistent with departure shifts
  const durationMs = targetReturn.getTime() - targetDeparture.getTime();

  // Step 3: Fan out searchFlights for every (airport, date) combination.
  // Each task fires two parallel one-way searches (outbound + return) and
  // returns a FlightGroup[] — one group per outbound, each with all available
  // return options sorted cheapest first.
  // Throttled in chunks of 5 tasks to respect SerpAPI rate limits.
  const CONCURRENCY_LIMIT = 5;
  const searchTasks = airports.flatMap(airport =>
    departureDates.map((depDateStr) => async (): Promise<FlightGroup[]> => {
      const depDate = new Date(depDateStr);
      const retDate = new Date(depDate.getTime() + durationMs);
      const retDateStr = retDate.toISOString().split("T")[0];

      const [outboundResults, returnResults] = await Promise.all([
        searchFlights({ origin: airport.code, destination, date: depDateStr }),
        searchFlights({ origin: destination, destination: airport.code, date: retDateStr }),
      ]);

      const sortedReturns = [...returnResults].sort((a, b) => a.priceUsd - b.priceUsd);
      const cheapestReturnPrice = sortedReturns[0]?.priceUsd ?? 0;

      return outboundResults.map(flight => {
        const outbound: Flight = {
          ...flight,
          originAirport: airport.code,
          distanceFromHomeAirportMiles: airport.distanceMiles,
          saturdayNightStay: isSaturdayNightStay(depDate, retDate),
          saturdayNightSavingsUsd: 0,
        };
        return {
          outbound,
          returns: sortedReturns,
          cheapestTotalUsd: flight.priceUsd + cheapestReturnPrice,
        };
      });
    })
  );

  const allGroupsNested: FlightGroup[][] = [];
  for (let i = 0; i < searchTasks.length; i += CONCURRENCY_LIMIT) {
    const batch = searchTasks.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(batch.map(task => task()));
    allGroupsNested.push(...batchResults);
  }

  // Step 4: Deduplicate groups by outbound ID, keeping the cheapest total
  const groupMap = new Map<string, FlightGroup>();
  for (const group of allGroupsNested.flat()) {
    const existing = groupMap.get(group.outbound.id);
    if (!existing || group.cheapestTotalUsd < existing.cheapestTotalUsd) {
      groupMap.set(group.outbound.id, group);
    }
  }
  let allGroups = Array.from(groupMap.values());

  // Step 5: Saturday-night savings delta calculation
  const origins = Array.from(new Set(allGroups.map(g => g.outbound.originAirport)));
  origins.forEach(origin => {
    const originGroups = allGroups.filter(g => g.outbound.originAirport === origin);
    const nonSatGroups = originGroups.filter(g => !g.outbound.saturdayNightStay);

    if (nonSatGroups.length > 0) {
      const cheapestNonSatPrice = Math.min(...nonSatGroups.map(g => g.cheapestTotalUsd));
      allGroups = allGroups.map(g => {
        if (g.outbound.originAirport === origin && g.outbound.saturdayNightStay) {
          const savings = Math.max(0, cheapestNonSatPrice - g.cheapestTotalUsd);
          return { ...g, outbound: { ...g.outbound, saturdayNightSavingsUsd: savings } };
        }
        return g;
      });
    }
  });

  // Step 6: Sort by cheapestTotalUsd ascending
  return allGroups.sort((a, b) => a.cheapestTotalUsd - b.cheapestTotalUsd);
}
