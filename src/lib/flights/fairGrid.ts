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
import type { Flight } from "@/types/flight";

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
 */
export async function runFairGrid(params: FairGridParams): Promise<Flight[]> {
  const {
    homeAirport,
    destination,
    targetDeparture,
    targetReturn,
    windowDays = 5,
    radiusMiles = 100
  } = params;

  // Step 1: Expand airports
  const airports = getAirportsWithinRadius(homeAirport, radiusMiles);

  // Step 2: Build date window
  const departureDates = buildDateWindow(targetDeparture, windowDays);
  
  // Trip duration in milliseconds to keep return dates consistent with departure shifts
  const durationMs = targetReturn.getTime() - targetDeparture.getTime();

  // Step 3: Fan out searchFlights for every (airport, date) combination
  // Throttled in chunks of 5 to avoid SerpAPI rate limits and conserve quota
  const CONCURRENCY_LIMIT = 5;
  const searchTasks = airports.flatMap(airport =>
    departureDates.map((depDateStr) => async () => {
      const depDate = new Date(depDateStr);
      const retDate = new Date(depDate.getTime() + durationMs);
      const retDateStr = retDate.toISOString().split("T")[0];

      const results = await searchFlights({
        origin: airport.code,
        destination,
        date: depDateStr,
        returnDate: retDateStr
      });

      // Attach originAirport and calculate Saturday night stay
      return results.map(flight => ({
        ...flight,
        originAirport: airport.code,
        distanceFromHomeAirportMiles: airport.distanceMiles,
        saturdayNightStay: isSaturdayNightStay(depDate, retDate),
        saturdayNightSavingsUsd: 0
      }));
    })
  );

  const allResultsNested: Flight[][] = [];
  for (let i = 0; i < searchTasks.length; i += CONCURRENCY_LIMIT) {
    const batch = searchTasks.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(batch.map(task => task()));
    allResultsNested.push(...batchResults);
  }

  let allResults = allResultsNested.flat();

  // Step 4: Deduplicate flights by ID
  // Multiple date windows might resolve to the same flight; keep the cheapest instance
  const uniqueFlights = new Map<string, Flight>();
  for (const f of allResults) {
    const existing = uniqueFlights.get(f.id);
    if (!existing || f.priceUsd < existing.priceUsd) {
      uniqueFlights.set(f.id, f);
    }
  }
  allResults = Array.from(uniqueFlights.values());

  // Step 5: Run Saturday-night savings delta calculation
  // Group by origin airport to find the cheapest non-Saturday flight for each origin
  const origins = Array.from(new Set(allResults.map(f => f.originAirport)));
  
  origins.forEach(origin => {
    const originFlights = allResults.filter(f => f.originAirport === origin);
    const nonSatFlights = originFlights.filter(f => !f.saturdayNightStay);
    
    if (nonSatFlights.length > 0) {
      const cheapestNonSatPrice = Math.min(...nonSatFlights.map(f => f.priceUsd));
      
      // Update all flights for this origin with the savings delta
      allResults = allResults.map(f => {
        if (f.originAirport === origin && f.saturdayNightStay) {
          return {
            ...f,
            saturdayNightSavingsUsd: Math.max(0, cheapestNonSatPrice - f.priceUsd)
          };
        }
        return f;
      });
    }
  });

  // Step 6: Sort by priceUsd ascending and return
  return allResults.sort((a, b) => a.priceUsd - b.priceUsd);
}
