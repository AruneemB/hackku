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

export const KNOWN_AIRPORTS: AirportInfo[] = [
  // Kansas City area
  { code: "MCI", name: "Kansas City Intl", lat: 39.2976, lng: -94.7139, distanceMiles: 0 },
  { code: "STL", name: "St. Louis Lambert", lat: 38.7487, lng: -90.3700, distanceMiles: 0 },
  { code: "OMA", name: "Omaha Eppley", lat: 41.3032, lng: -95.8941, distanceMiles: 0 },
  // Chicago area
  { code: "ORD", name: "Chicago O'Hare Intl", lat: 41.9742, lng: -87.9073, distanceMiles: 0 },
  { code: "MDW", name: "Chicago Midway", lat: 41.7868, lng: -87.7522, distanceMiles: 0 },
  { code: "MKE", name: "Milwaukee Mitchell", lat: 42.9472, lng: -87.8966, distanceMiles: 0 },
  // New York area
  { code: "JFK", name: "New York JFK", lat: 40.6413, lng: -73.7781, distanceMiles: 0 },
  { code: "LGA", name: "New York LaGuardia", lat: 40.7769, lng: -73.8740, distanceMiles: 0 },
  { code: "EWR", name: "Newark Liberty", lat: 40.6895, lng: -74.1745, distanceMiles: 0 },
  // Boston
  { code: "BOS", name: "Boston Logan", lat: 42.3656, lng: -71.0096, distanceMiles: 0 },
  // Washington DC area
  { code: "DCA", name: "Washington Reagan", lat: 38.8521, lng: -77.0377, distanceMiles: 0 },
  { code: "IAD", name: "Washington Dulles", lat: 38.9531, lng: -77.4565, distanceMiles: 0 },
  // Atlanta
  { code: "ATL", name: "Atlanta Hartsfield-Jackson", lat: 33.6407, lng: -84.4277, distanceMiles: 0 },
  // Miami
  { code: "MIA", name: "Miami Intl", lat: 25.7959, lng: -80.2870, distanceMiles: 0 },
  // Dallas area
  { code: "DFW", name: "Dallas/Fort Worth Intl", lat: 32.8998, lng: -97.0403, distanceMiles: 0 },
  { code: "DAL", name: "Dallas Love Field", lat: 32.8471, lng: -96.8518, distanceMiles: 0 },
  // Houston area
  { code: "IAH", name: "Houston George Bush", lat: 29.9902, lng: -95.3368, distanceMiles: 0 },
  // Denver
  { code: "DEN", name: "Denver Intl", lat: 39.8561, lng: -104.6737, distanceMiles: 0 },
  // Phoenix
  { code: "PHX", name: "Phoenix Sky Harbor", lat: 33.4373, lng: -112.0078, distanceMiles: 0 },
  // Los Angeles area
  { code: "LAX", name: "Los Angeles Intl", lat: 33.9425, lng: -118.4081, distanceMiles: 0 },
  { code: "BUR", name: "Burbank Bob Hope", lat: 34.2007, lng: -118.3585, distanceMiles: 0 },
  // San Francisco area
  { code: "SFO", name: "San Francisco Intl", lat: 37.6213, lng: -122.3790, distanceMiles: 0 },
  { code: "OAK", name: "Oakland Intl", lat: 37.7213, lng: -122.2208, distanceMiles: 0 },
  { code: "SJC", name: "San Jose Intl", lat: 37.3626, lng: -121.9290, distanceMiles: 0 },
  // Seattle
  { code: "SEA", name: "Seattle-Tacoma Intl", lat: 47.4502, lng: -122.3088, distanceMiles: 0 },
  // Minneapolis
  { code: "MSP", name: "Minneapolis-Saint Paul Intl", lat: 44.8848, lng: -93.2223, distanceMiles: 0 },
  // Detroit
  { code: "DTW", name: "Detroit Metro Wayne County", lat: 42.2162, lng: -83.3554, distanceMiles: 0 },
  // Philadelphia
  { code: "PHL", name: "Philadelphia Intl", lat: 39.8744, lng: -75.2424, distanceMiles: 0 },
  // Charlotte
  { code: "CLT", name: "Charlotte Douglas Intl", lat: 35.2140, lng: -80.9431, distanceMiles: 0 },
  // Toronto
  { code: "YYZ", name: "Toronto Pearson", lat: 43.6777, lng: -79.6248, distanceMiles: 0 },
  // London area
  { code: "LHR", name: "London Heathrow", lat: 51.4700, lng: -0.4543, distanceMiles: 0 },
  { code: "LGW", name: "London Gatwick", lat: 51.1537, lng: -0.1821, distanceMiles: 0 },
  // Paris
  { code: "CDG", name: "Paris Charles de Gaulle", lat: 49.0097, lng: 2.5479, distanceMiles: 0 },
  // Milan area (destination)
  { code: "MXP", name: "Milan Malpensa", lat: 45.6301, lng: 8.7231, distanceMiles: 0 },
  { code: "LIN", name: "Milan Linate", lat: 45.4451, lng: 9.2767, distanceMiles: 0 },
  { code: "BGY", name: "Milan Bergamo", lat: 45.6672, lng: 9.7018, distanceMiles: 0 },
  // Rome
  { code: "FCO", name: "Rome Fiumicino", lat: 41.8003, lng: 12.2389, distanceMiles: 0 },
  // Amsterdam
  { code: "AMS", name: "Amsterdam Schiphol", lat: 52.3105, lng: 4.7683, distanceMiles: 0 },
  // Frankfurt
  { code: "FRA", name: "Frankfurt Intl", lat: 50.0379, lng: 8.5622, distanceMiles: 0 },
  // Zurich
  { code: "ZRH", name: "Zurich Intl", lat: 47.4647, lng: 8.5492, distanceMiles: 0 },
  // Madrid
  { code: "MAD", name: "Madrid Barajas", lat: 40.4936, lng: -3.5668, distanceMiles: 0 },
  // Barcelona
  { code: "BCN", name: "Barcelona El Prat", lat: 41.2974, lng: 2.0833, distanceMiles: 0 },
  // Lisbon
  { code: "LIS", name: "Lisbon Humberto Delgado", lat: 38.7742, lng: -9.1342, distanceMiles: 0 },
  // Dubai
  { code: "DXB", name: "Dubai Intl", lat: 25.2532, lng: 55.3657, distanceMiles: 0 },
  // Tokyo area
  { code: "NRT", name: "Tokyo Narita", lat: 35.7647, lng: 140.3864, distanceMiles: 0 },
  { code: "HND", name: "Tokyo Haneda", lat: 35.5494, lng: 139.7798, distanceMiles: 0 },
  // Singapore
  { code: "SIN", name: "Singapore Changi", lat: 1.3644, lng: 103.9915, distanceMiles: 0 },
  // Sydney
  { code: "SYD", name: "Sydney Kingsford Smith", lat: -33.9399, lng: 151.1753, distanceMiles: 0 },
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
