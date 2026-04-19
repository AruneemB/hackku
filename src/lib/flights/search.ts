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
import {
  DEFAULT_SERP_TRAVEL_CLASS,
  type Flight,
  type FlightLeg,
  type FlightSearchParams,
} from "@/types/flight";
import { withFlightCache } from "./cache";

type SerpFlightsQuery = Record<string, string | number | undefined>; // type: 1=round-trip, 2=one-way

interface SerpAirportRef {
  id: string;
  time: string;
}

interface SerpFlightSegmentRaw {
  departure_airport: SerpAirportRef;
  arrival_airport: SerpAirportRef;
  airline: string;
  flight_number: string;
  duration: number;
}

interface SerpFlightOptionRaw {
  flights?: SerpFlightSegmentRaw[];
  price: number;
}

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
    const query: SerpFlightsQuery = {
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
      query.type = 1; // round-trip
    } else {
      query.type = 2; // one-way — SerpAPI defaults to round-trip and returns 0 results without a return_date
    }

    if (params.adults) {
      query.adults = params.adults;
    }

    query.travel_class = params.travelClass ?? DEFAULT_SERP_TRAVEL_CLASS;

    const results = (await getJson(query)) as Record<string, unknown>;
    const bestFlights = Array.isArray(results.best_flights) ? results.best_flights : [];
    const otherFlights = Array.isArray(results.other_flights) ? results.other_flights : [];
    const allFlightOptions = [...bestFlights, ...otherFlights] as SerpFlightOptionRaw[];

    return allFlightOptions.map((option) => {
      const flights = option.flights ?? [];
      if (flights.length === 0) return null;

      // Map a SerpAPI flight segment to our FlightLeg type
      const mapToLeg = (f: SerpFlightSegmentRaw): FlightLeg => ({
        origin: f.departure_airport.id,
        destination: f.arrival_airport.id,
        departureTime: new Date(f.departure_airport.time),
        arrivalTime: new Date(f.arrival_airport.time),
        carrier: f.airline,
        flightNumber: f.flight_number,
        durationMinutes: f.duration
      });

      // Find the final outbound segment: the one that arrives at params.destination.
      // For connecting flights SerpAPI may return [ORD→FRA, FRA→MXP, ...]; we want
      // the outbound leg to show ORD→MXP, not ORD→FRA.
      const destIdx = flights.findIndex((s) => s.arrival_airport.id === params.destination);
      const lastOutboundSeg = destIdx >= 0 ? flights[destIdx] : flights[0];

      const outboundSegs = destIdx >= 0 ? flights.slice(0, destIdx + 1) : [flights[0]];
      const outbound: FlightLeg = {
        ...mapToLeg(flights[0]),
        destination: lastOutboundSeg.arrival_airport.id,
        arrivalTime: new Date(lastOutboundSeg.arrival_airport.time),
        durationMinutes: outboundSegs.reduce((sum, s) => sum + s.duration, 0),
        layoverAirports: outboundSegs.slice(0, -1).map(s => s.arrival_airport.id),
      };

      // Round-trip requires at least 2 segments; skip if return is missing
      if (params.returnDate && flights.length < 2) return null;

      // Inbound: all segments after the outbound turnaround point
      const inboundStart = destIdx >= 0 ? destIdx + 1 : 1;
      const inboundSegs = flights.slice(inboundStart);
      const inbound: FlightLeg = inboundSegs.length > 0
        ? {
            origin: inboundSegs[0].departure_airport.id,
            destination: inboundSegs[inboundSegs.length - 1].arrival_airport.id,
            departureTime: new Date(inboundSegs[0].departure_airport.time),
            arrivalTime: new Date(inboundSegs[inboundSegs.length - 1].arrival_airport.time),
            carrier: inboundSegs[0].airline,
            flightNumber: inboundSegs[0].flight_number,
            durationMinutes: inboundSegs.reduce((sum, s) => sum + s.duration, 0),
            layoverAirports: inboundSegs.slice(0, -1).map(s => s.arrival_airport.id),
          }
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
