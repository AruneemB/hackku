// ============================================================
// LIB: Flight Search API Wrapper
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Queries SerpAPI's Google Flights endpoint (or
//   Amadeus as fallback) and normalizes results into our
//   Flight type. Called by fairGrid.ts which calls this
//   function multiple times for the 5-day window.
//
// PRIMARY: SerpAPI → https://serpapi.com/google-flights-api
// FALLBACK: Amadeus for Developers (sandbox free tier)
//
// ENV REQUIRED: SERPAPI_KEY or (AMADEUS_CLIENT_ID + AMADEUS_CLIENT_SECRET)
//
// USAGE:
//   const flights = await searchFlights({ origin: "MCI", destination: "MXP",
//     date: "2025-09-14", adults: 1 })
// ============================================================

import { getJson } from "serpapi";
import type { Flight, FlightLeg, FlightSearchParams } from "@/types/flight";
import { withFlightCache } from "./cache";

/**
 * Internal implementation of flight search using SerpAPI.
 */
async function searchFlightsInternal(params: FlightSearchParams): Promise<Flight[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.warn("SERPAPI_KEY is missing. Returning empty flight results.");
    return [];
  }

  try {
    const query: any = {
      engine: "google_flights",
      departure_id: params.origin,
      arrival_id: params.destination,
      outbound_date: params.date,
      currency: "USD",
      hl: "en",
      api_key: apiKey,
    };

    if (params.returnDate) {
      query.return_date = params.returnDate;
    }

    if (params.adults) {
      query.adults = params.adults;
    }

    const results = await getJson(query);

    const bestFlights = results.best_flights || [];
    const otherFlights = results.other_flights || [];
    const allFlightOptions = [...bestFlights, ...otherFlights];

    return allFlightOptions.map((option: any) => {
      const flights = option.flights || [];
      if (flights.length === 0) return null;

      // Map a SerpAPI flight segment to our FlightLeg type
      const mapToLeg = (f: any): FlightLeg => ({
        origin: f.departure_airport.id,
        destination: f.arrival_airport.id,
        departureTime: new Date(f.departure_airport.time),
        arrivalTime: new Date(f.arrival_airport.time),
        carrier: f.airline,
        flightNumber: f.flight_number,
        durationMinutes: f.duration
      });

      const outbound = mapToLeg(flights[0]);
      
      // Inbound mapping logic:
      // If it's a round trip, we expect at least two segments (outbound + inbound).
      // We take the last segment as the representative inbound leg for now.
      // If there's only one segment but a returnDate was requested, we fallback to the same leg or a dummy.
      const inbound = (params.returnDate && flights.length > 1) 
        ? mapToLeg(flights[flights.length - 1]) 
        : outbound;

      // Generate a consistent ID: serp_flightNumber_origin_destination_MMDD
      const flightNumberNorm = outbound.flightNumber.toLowerCase().replace(/\s+/g, "");
      const dateNorm = params.date.replace(/-/g, "").slice(4, 8); // Extract MMDD from YYYY-MM-DD
      const id = `serp_${flightNumberNorm}_${outbound.origin.toLowerCase()}_${outbound.destination.toLowerCase()}_${dateNorm}`;

      return {
        id,
        outbound,
        inbound,
        priceUsd: option.price,
        saturdayNightStay: false,       // Calculated downstream by fairGrid.ts
        saturdayNightSavingsUsd: 0,     // Calculated downstream
        originAirport: outbound.origin, // Used for expanded airport search logic
        distanceFromHomeAirportMiles: 0,
        source: "serpapi"
      } as Flight;
    }).filter((f): f is Flight => f !== null);

  } catch (error) {
    console.warn("SerpAPI request failed:", error);
    return [];
  }
}

/**
 * Searches for flights using SerpAPI's Google Flights engine.
 * Results are cached for 60 seconds to prevent redundant API hits.
 */
export async function searchFlights(params: FlightSearchParams): Promise<Flight[]> {
  return withFlightCache(params, searchFlightsInternal);
}
