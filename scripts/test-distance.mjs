// Inline the pure logic from airports.ts and OnGroundSupport.tsx
// so this runs with plain `node scripts/test-distance.mjs`

const MILES_TO_KM = 1.60934;

const KNOWN_AIRPORTS = [
  { code: "MXP", name: "Milan Malpensa",  lat: 45.6301, lng: 8.7231 },
  { code: "LIN", name: "Milan Linate",    lat: 45.4451, lng: 9.2767 },
  { code: "BGY", name: "Milan Bergamo",   lat: 45.6672, lng: 9.7018 },
  { code: "LHR", name: "London Heathrow", lat: 51.4700, lng: -0.4543 },
  { code: "JFK", name: "New York JFK",    lat: 40.6413, lng: -73.7781 },
];

function haversineDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTransportMode(distanceKm) {
  if (distanceKm < 3)  return "Walk / Rideshare";
  if (distanceKm < 15) return "Rideshare";
  return "Company Car Recommended";
}

function computeDistance(iata, hotelLat, hotelLng) {
  const airport = KNOWN_AIRPORTS.find(a => a.code === iata);
  if (!airport) return { error: `Airport ${iata} not found` };
  const distanceKm = haversineDistanceMiles(airport.lat, airport.lng, hotelLat, hotelLng) * MILES_TO_KM;
  return { distanceKm, airportName: airport.name, transport: getTransportMode(distanceKm) };
}

// ── Test runner ──────────────────────────────────────────────
let passed = 0, failed = 0;

function expect(label, actual, predicate) {
  if (predicate(actual)) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — got: ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── getTransportMode ─────────────────────────────────────────
console.log("\ngetTransportMode");
expect("1 km → Walk / Rideshare",         getTransportMode(1),    v => v === "Walk / Rideshare");
expect("2.9 km → Walk / Rideshare",       getTransportMode(2.9),  v => v === "Walk / Rideshare");
expect("3 km → Rideshare",                getTransportMode(3),    v => v === "Rideshare");
expect("10 km → Rideshare",               getTransportMode(10),   v => v === "Rideshare");
expect("14.9 km → Rideshare",             getTransportMode(14.9), v => v === "Rideshare");
expect("15 km → Company Car",             getTransportMode(15),   v => v === "Company Car Recommended");
expect("50 km → Company Car",             getTransportMode(50),   v => v === "Company Car Recommended");

// ── computeDistance — error cases ────────────────────────────
console.log("\ncomputeDistance — errors");
expect("unknown IATA returns error",
  computeDistance("ZZZ", 45.46, 9.19),
  v => "error" in v && v.error.includes("ZZZ"));

// ── computeDistance — MXP → Milan city centre ────────────────
console.log("\ncomputeDistance — MXP (Malpensa, ~45 km out)");
const mxp = computeDistance("MXP", 45.4654, 9.1866);
expect("no error",              mxp, v => !("error" in v));
expect("airport name correct",  mxp.airportName, v => v === "Milan Malpensa");
expect("distance 35–60 km",     mxp.distanceKm,  v => v > 35 && v < 60);
expect("transport: company car", mxp.transport,  v => v === "Company Car Recommended");

// ── computeDistance — LIN → Milan city centre ────────────────
console.log("\ncomputeDistance — LIN (Linate, ~7 km out)");
const lin = computeDistance("LIN", 45.4654, 9.1866);
expect("no error",              lin, v => !("error" in v));
expect("airport name correct",  lin.airportName, v => v === "Milan Linate");
expect("distance 4–15 km",      lin.distanceKm,  v => v > 4 && v < 15);
expect("transport: rideshare",  lin.transport,   v => v === "Rideshare");

// ── Summary ──────────────────────────────────────────────────
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
