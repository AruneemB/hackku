import { NextRequest, NextResponse } from "next/server";

// Static airport coordinates [lon, lat]
const AIRPORT_COORDS: Record<string, [number, number]> = {
  MXP: [8.7281, 45.6306],   // Milan Malpensa
  LIN: [9.2765, 45.4454],   // Milan Linate
  LHR: [-0.4543, 51.4700],  // London Heathrow
  CDG: [2.5479, 49.0097],   // Paris Charles de Gaulle
  JFK: [-73.7789, 40.6413], // New York JFK
  LAX: [-118.4085, 33.9425],// Los Angeles
  FCO: [12.2389, 41.8003],  // Rome Fiumicino
  BCN: [2.0785, 41.2971],   // Barcelona
  AMS: [4.7683, 52.3086],   // Amsterdam Schiphol
  FRA: [8.5622, 50.0379],   // Frankfurt
};

// Demo fallbacks for common addresses
const STATIC_HOTEL_COORDS: Record<string, [number, number]> = {
  "VIA DELLA SPIGA 31, MILAN": [9.1945, 45.4706],
  "VIA DELLA SPIGA 31": [9.1945, 45.4706],
  "MARRIOTT SCALA": [9.1945, 45.4706],
};

const ORS_BASE = "https://api.openrouteservice.org";

function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = (coords2[1] - coords1[1]) * Math.PI / 180;
  const dLon = (coords2[0] - coords1[0]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1[1] * Math.PI / 180) * Math.cos(coords2[1] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocode(address: string, apiKey: string): Promise<[number, number]> {
  const url = `${ORS_BASE}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&size=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const data = await res.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) throw new Error("No geocode result");
  return [coords[0], coords[1]]; // [lon, lat]
}

async function directions(
  profile: "driving-car" | "foot-walking",
  start: [number, number],
  end: [number, number],
  apiKey: string,
): Promise<{ distanceM: number; durationS: number }> {
  const url = `${ORS_BASE}/v2/directions/${profile}?api_key=${apiKey}&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions failed (${profile}): ${res.status}`);
  const data = await res.json();
  const seg = data.routes?.[0]?.summary;
  if (!seg) throw new Error("No route summary");
  return { distanceM: seg.distance, durationS: seg.duration };
}

function formatMin(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function taxiCost(distanceM: number): string {
  const km = distanceM / 1000;
  const cost = 4.0 + km * 1.8;
  return `$${cost.toFixed(0)}`;
}

export async function GET(req: NextRequest) {
  const hotelAddress = req.nextUrl.searchParams.get("hotel") || "";
  const airportIATA = req.nextUrl.searchParams.get("airport")?.toUpperCase() || "";

  if (!hotelAddress || !airportIATA) {
    return NextResponse.json({ error: "hotel and airport params required" }, { status: 400 });
  }

  const airportCoords = AIRPORT_COORDS[airportIATA];
  if (!airportCoords) {
    return NextResponse.json({ error: `Unknown airport: ${airportIATA}` }, { status: 400 });
  }

  const apiKey = process.env.ORS_API_KEY;

  // 1. Try Live API if Key is present
  if (apiKey && !apiKey.startsWith("YOUR_")) {
    try {
      const hotelCoords = await geocode(hotelAddress, apiKey);
      const [drive, walk] = await Promise.all([
        directions("driving-car", airportCoords, hotelCoords, apiKey),
        directions("foot-walking", airportCoords, hotelCoords, apiKey),
      ]);

      const distanceKm = +(drive.distanceM / 1000).toFixed(1);
      return NextResponse.json({
        distanceKm,
        taxi: {
          minutes: formatMin(drive.durationS),
          cost: taxiCost(drive.distanceM),
          distanceKm,
        },
        metro: {
          minutes: formatMin(drive.durationS * 1.55),
          cost: "$2.50",
        },
        walk: {
          minutes: formatMin(walk.durationS),
          cost: "Free",
        },
      });
    } catch (err) {
      console.error("[transport/distance] API Error, falling back to static:", err);
    }
  }

  // 2. Static Fallback (No Key or API Failure)
  const normalizedAddr = hotelAddress.toUpperCase();
  const hotelCoords = STATIC_HOTEL_COORDS[normalizedAddr] 
    || Object.entries(STATIC_HOTEL_COORDS).find(([k]) => normalizedAddr.includes(k))?.[1]
    || [9.1866, 45.4654]; // Default to Milan City Centre

  const directDistKm = haversineDistance(airportCoords, hotelCoords);
  const roadDistKm = directDistKm * 1.25; // Estimate road distance as 25% longer than direct
  const driveTimeS = (roadDistKm / 50) * 3600; // Assume 50km/h avg speed
  const walkTimeS = (roadDistKm / 4.5) * 3600; // Assume 4.5km/h walking speed

  return NextResponse.json({
    distanceKm: +roadDistKm.toFixed(1),
    taxi: {
      minutes: formatMin(driveTimeS),
      cost: taxiCost(roadDistKm * 1000),
      distanceKm: +roadDistKm.toFixed(1),
    },
    metro: {
      minutes: formatMin(driveTimeS * 1.4),
      cost: "$2.50",
    },
    walk: {
      minutes: formatMin(walkTimeS),
      cost: "Free",
    },
  });
}
