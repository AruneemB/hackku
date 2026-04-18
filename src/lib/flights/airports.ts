// ============================================================
// LIB: Airport Radius Expansion
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Given a home airport IATA code, returns all
//   airports within radiusMiles. Used by fairGrid.ts to expand
//   the search beyond the user's nearest airport.
//
//   Distance calculation uses the Haversine formula.
// ============================================================

/**
 * Airport information used for location expansion.
 */
export interface AirportInfo {
  code: string;          // IATA
  name: string;
  lat: number;
  lng: number;
  distanceMiles: number; // from search origin
}

/**
 * Demo-relevant airports for the HackKU project.
 * Includes Kansas City area (origin) and Milan area (destination).
 */
export const KNOWN_AIRPORTS: AirportInfo[] = [
  { code: "MCI", name: "Kansas City Intl", lat: 39.2976, lng: -94.7139, distanceMiles: 0 },
  { code: "MKC", name: "Downtown Kansas City", lat: 39.1232, lng: -94.5927, distanceMiles: 0 },
  { code: "STL", name: "St. Louis Lambert", lat: 38.7487, lng: -90.3700, distanceMiles: 0 },
  { code: "FOE", name: "Topeka Forbes Field", lat: 38.9509, lng: -95.6636, distanceMiles: 0 },
  { code: "ICT", name: "Wichita Eisenhower", lat: 37.6499, lng: -97.4331, distanceMiles: 0 },
  { code: "OMA", name: "Eppley Airfield", lat: 41.3032, lng: -95.8941, distanceMiles: 0 },
  { code: "MXP", name: "Milan Malpensa", lat: 45.6301, lng: 8.7231, distanceMiles: 0 },
  { code: "LIN", name: "Milan Linate", lat: 45.4451, lng: 9.2767, distanceMiles: 0 },
  { code: "BGY", name: "Milan Bergamo", lat: 45.6672, lng: 9.7018, distanceMiles: 0 },
];

/**
 * Calculates the great-circle distance between two points in miles using the Haversine formula.
 */
export function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns all airports within a given radius of a home airport.
 * Results are sorted by distance ascending.
 */
export function getAirportsWithinRadius(homeCode: string, radiusMiles: number): AirportInfo[] {
  const home = KNOWN_AIRPORTS.find(a => a.code === homeCode);
  if (!home) return [];

  return KNOWN_AIRPORTS
    .map(airport => ({
      ...airport,
      distanceMiles: haversineDistanceMiles(home.lat, home.lng, airport.lat, airport.lng)
    }))
    .filter(airport => airport.distanceMiles <= radiusMiles)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}
