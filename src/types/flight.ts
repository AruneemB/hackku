// ============================================================
// TYPE: Flight
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: A single flight result from SerpAPI (Google
//   Flights wrapper) or Amadeus. The fairGrid algorithm in
//   lib/flights/fairGrid.ts produces an array of these ranked
//   by cost-effectiveness across a 5-day window.
// ============================================================

export interface FlightLeg {
  origin: string;       // IATA airport code
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  carrier: string;      // e.g. "American Airlines"
  flightNumber: string; // e.g. "AA2345"
  durationMinutes: number;
  layoverAirports?: string[]; // intermediate IATA codes; empty = nonstop
}

export interface Flight {
  id: string;
  outbound: FlightLeg;
  inbound: FlightLeg;
  priceUsd: number;
  saturdayNightStay: boolean;   // flag for Sat-night delta calc
  saturdayNightSavingsUsd: number; // how much cheaper vs non-Sat
  originAirport: string;        // may differ from home airport (expanded search)
  distanceFromHomeAirportMiles: number;
  source: "serpapi" | "amadeus"; // which API returned this
}

// -------------------------------------------------------
// EXAMPLE flight result from fairGrid search:
// {
//   "id": "serp_aa2345_lhr_mxp_0914",
//   "outbound": {
//     "origin": "MCI",
//     "destination": "MXP",
//     "departureTime": "2025-09-14T08:00:00.000Z",
//     "arrivalTime": "2025-09-14T22:30:00.000Z",
//     "carrier": "American Airlines",
//     "flightNumber": "AA2345",
//     "durationMinutes": 570
//   },
//   "priceUsd": 1240,
//   "saturdayNightStay": true,
//   "saturdayNightSavingsUsd": 180,
//   "originAirport": "MCI",
//   "distanceFromHomeAirportMiles": 0,
//   "source": "serpapi"
// }
// -------------------------------------------------------

export interface FlightGroup {
  outbound: Flight;
  returns: Flight[];
  cheapestTotalUsd: number;
}

// Live status from TimeSeries collection (Frame 9-10)
export interface FlightStatusUpdate {
  timestamp: Date;
  flightNumber: string;
  tripId: string;
  status: "on_time" | "delayed" | "cancelled";
  gate: string | null;
  delayMinutes: number;
  destination: string;
}

export interface FlightSearchParams {
  origin: string;       // IATA airport code
  destination: string;
  date: string;         // YYYY-MM-DD
  returnDate?: string;
  adults?: number;
}
