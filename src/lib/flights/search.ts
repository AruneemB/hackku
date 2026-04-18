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

// TODO: import { getJson } from "serpapi"
// TODO: import type { Flight } from "@/types"

// TODO: interface FlightSearchParams {
//   origin: string;       // IATA airport code
//   destination: string;
//   date: string;         // YYYY-MM-DD
//   returnDate?: string;
//   adults?: number;
// }

// TODO: export async function searchFlights(params: FlightSearchParams): Promise<Flight[]> {
//   // Call SerpAPI:
//   // const results = await getJson({
//   //   engine: "google_flights",
//   //   departure_id: params.origin,
//   //   arrival_id: params.destination,
//   //   outbound_date: params.date,
//   //   return_date: params.returnDate,
//   //   currency: "USD",
//   //   hl: "en",
//   //   api_key: process.env.SERPAPI_KEY,
//   // })
//
//   // Normalize results.best_flights + results.other_flights into Flight[]
//
//   // EXAMPLE normalized Flight result:
//   // {
//   //   "id": "serp_aa2345_mci_mxp_20250914",
//   //   "outbound": { "origin": "MCI", "destination": "MXP", "carrier": "American Airlines",
//   //     "flightNumber": "AA2345", "durationMinutes": 570 },
//   //   "priceUsd": 1240,
//   //   "source": "serpapi"
//   // }
// }
