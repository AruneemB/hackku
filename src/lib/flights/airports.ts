// ============================================================
// LIB: Airport Radius Expansion
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Given a home airport IATA code, returns all
//   airports within radiusMiles. Used by fairGrid.ts to expand
//   the search beyond the user's nearest airport.
//
//   For the demo, Kansas City (MCI) expands to include:
//   STL (St. Louis, 248mi — slightly over 100mi demo limit,
//   use ~150mi to get STL), MKC (Downtown KC), FOE (Topeka).
//   In practice just MCI and maybe STL.
//
//   Distance calculation uses the Haversine formula.
// ============================================================

// TODO: interface AirportInfo {
//   code: string;   // IATA
//   name: string;
//   lat: number;
//   lng: number;
//   distanceMiles: number;  // from home airport
// }

// TODO: const KNOWN_AIRPORTS: AirportInfo[] = [
//   { code: "MCI", name: "Kansas City Intl", lat: 39.2976, lng: -94.7139, distanceMiles: 0 },
//   { code: "STL", name: "St. Louis Lambert", lat: 38.7487, lng: -90.3700, distanceMiles: 243 },
//   { code: "MKC", name: "Downtown Kansas City", lat: 39.1232, lng: -94.5927, distanceMiles: 11 },
//   // ... add more as needed
// ]

// TODO: export function getAirportsWithinRadius(homeCode: string, radiusMiles: number): AirportInfo[] {
//   // Find home airport coords, then filter by Haversine distance
//   // EXAMPLE RETURN for MCI + 100mi radius:
//   // [{ code: "MCI", distanceMiles: 0 }, { code: "MKC", distanceMiles: 11 }]
// }

// TODO: function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
//   // Standard Haversine formula
// }
