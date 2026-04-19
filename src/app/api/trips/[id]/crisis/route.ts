// @ts-nocheck
// ============================================================
// API ROUTE: Crisis Detection + Rebooking
// ROUTE: GET /api/trips/[id]/crisis?delayMinutes=N
//
// Returns the crisis payload for DemoCrisisPanel / CrisisAlert:
//   - alternative  — real flight from Fair Grid (timeout 8s), then
//                    demo_alternatives as fallback
//   - isOverBudget — alternative price vs trip budgetCapUsd
//   - mascotMessage — Gemini message personalised with origin/dest
//   - exceptionDraft — Gemini email draft (only when isOverBudget)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/client";
import clientPromise from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";
import { geminiModel } from "@/lib/gemini/client";
import { buildExceptionRequestPrompt } from "@/lib/gemini/prompts";
import { runFairGrid } from "@/lib/flights/fairGrid";

const CONNECTION_BUFFER_MINUTES = 45;
const FAIR_GRID_TIMEOUT_MS = 8000;

// Destination-city → primary airport code (mirrors demo page CITY_TO_AIRPORT)
const CITY_TO_AIRPORT: Record<string, string> = {
  milan: "MXP", rome: "FCO", paris: "CDG", london: "LHR",
  amsterdam: "AMS", frankfurt: "FRA", madrid: "MAD",
  barcelona: "BCN", lisbon: "LIS", zurich: "ZRH",
  tokyo: "NRT", dubai: "DXB", singapore: "SIN", sydney: "SYD",
  "new york": "JFK", "los angeles": "LAX", chicago: "ORD",
};

type CrisisRouteContext = { params: Promise<{ id: string }> };

function decimal128ToString(val: unknown, fallback: string): string {
  if (val == null) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && "toString" in (val as object)) {
    return (val as { toString(): string }).toString();
  }
  return fallback;
}

// Try to parse the origin airport from a route string like "ORD → MXP".
function parseOriginFromRoute(route: unknown): string | null {
  if (typeof route !== "string") return null;
  const match = /^([A-Z]{3})/.exec(route.trim());
  return match?.[1] ?? null;
}

// Extract the origin airport code from whatever flight data was saved to MongoDB.
function extractOrigin(tripDoc: Record<string, unknown>): string {
  const bundle = tripDoc.selectedBundle as Record<string, unknown> | null | undefined;
  const bundleOrigin = (bundle?.flight as Record<string, unknown> | undefined)
    ?.outbound as Record<string, unknown> | undefined;
  if (typeof bundleOrigin?.origin === "string") return bundleOrigin.origin;

  const flights = tripDoc.flights as Array<Record<string, unknown>> | undefined;
  const f0 = flights?.[0];
  if (typeof (f0?.outbound as Record<string, unknown> | undefined)?.origin === "string") {
    return (f0!.outbound as Record<string, unknown>).origin as string;
  }
  // DisplayFlightGroup stores route as "ORD → MXP"
  const fromRoute = parseOriginFromRoute(f0?.route);
  return fromRoute ?? "ORD";
}

type AlternativeFlight = {
  flightNumber: string;
  carrier: string;
  departureTime: string;
  arrivalTime: string;
  priceUsd: number;
  origin: string;
  destination: string;
};

// Call Fair Grid with a hard timeout; returns null on timeout or error.
async function searchFairGridAlternative(
  origin: string,
  destAirport: string,
  departure: Date,
  returnDate: Date,
): Promise<AlternativeFlight | null> {
  const search = runFairGrid({
    homeAirport: origin,
    destination: destAirport,
    targetDeparture: departure,
    targetReturn: returnDate,
    windowDays: 1,
  });
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), FAIR_GRID_TIMEOUT_MS)
  );
  const result = await Promise.race([search, timeout]).catch(() => null);
  if (!result || result.length === 0) return null;

  const group = result[0];
  const leg = group.outbound.outbound;
  return {
    flightNumber: leg.flightNumber,
    carrier: leg.carrier,
    departureTime: new Date(leg.departureTime).toISOString(),
    arrivalTime: new Date(leg.arrivalTime).toISOString(),
    priceUsd: group.outbound.priceUsd,
    origin: leg.origin,
    destination: leg.destination,
  };
}

export async function GET(req: NextRequest, context: CrisisRouteContext) {
  const { id } = await context.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid trip id" }, { status: 400 });
  }

  const delayMinutes = parseInt(req.nextUrl.searchParams.get("delayMinutes") ?? "0", 10);

  if (delayMinutes <= CONNECTION_BUFFER_MINUTES) {
    return NextResponse.json({ crisis: false });
  }

  await connectToDatabase();
  const trip = await Trip.findById(id).lean();
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const tripDoc = trip as Record<string, unknown> & {
    destination?: { city?: string; country?: string };
    budgetCapUsd?: unknown;
    totalSpendUsd?: unknown;
    dates?: { departure?: Date; return?: Date };
    selectedBundle?: {
      totalCostUsd?: number;
      flight?: { outbound?: { flightNumber?: string; carrier?: string } };
    };
  };

  // ── Resolve origin / destination ─────────────────────────────
  const origin = extractOrigin(tripDoc);
  const destCity = (tripDoc.destination?.city ?? "Milan").toLowerCase();
  const destAirport = CITY_TO_AIRPORT[destCity] ?? "MXP";
  const departure = tripDoc.dates?.departure ? new Date(tripDoc.dates.departure) : new Date();
  const returnDate = tripDoc.dates?.return ? new Date(tripDoc.dates.return) : new Date();

  // Original flight info for personalised messages
  const origFlight = tripDoc.selectedBundle?.flight?.outbound;
  const origFlightLabel = origFlight
    ? `${origFlight.carrier} ${origFlight.flightNumber}`
    : "your flight";

  // ── Find alternative (Fair Grid first, demo_alternatives fallback) ──
  let alternative: AlternativeFlight | null = await searchFairGridAlternative(
    origin, destAirport, departure, returnDate
  );

  if (!alternative) {
    // Fallback: static demo_alternatives collection keyed by destination country
    const mongoClient = await clientPromise;
    const db = mongoClient.db("hackku");
    const altDoc = await db
      .collection("demo_alternatives")
      .findOne({ destinationCountry: tripDoc.destination?.country ?? "IT" });

    if (altDoc) {
      alternative = {
        flightNumber: altDoc.flightNumber as string,
        carrier: altDoc.carrier as string,
        departureTime: altDoc.departureTime as string,
        arrivalTime: altDoc.arrivalTime as string,
        priceUsd: altDoc.priceUsd as number,
        origin: altDoc.origin as string,
        destination: altDoc.destination as string,
      };
    }
  }

  // ── Budget check ──────────────────────────────────────────────
  const budgetCap = parseFloat(decimal128ToString(tripDoc.budgetCapUsd, "2800"));
  const currentSpend = parseFloat(decimal128ToString(tripDoc.totalSpendUsd, "0"));
  const altPrice = alternative?.priceUsd ?? 0;
  const isOverBudget = alternative ? currentSpend + altPrice > budgetCap : false;
  const overageUsd = isOverBudget ? Math.round(currentSpend + altPrice - budgetCap) : 0;

  // ── Personalised Gemini mascot message ───────────────────────
  const altSummary = alternative
    ? `${alternative.carrier} ${alternative.flightNumber} departing ${new Date(alternative.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ($${alternative.priceUsd})`
    : "No automated alternative found — contact the airline desk.";

  const crisisPrompt = `You are Lockey, a helpful and empathetic AI travel concierge.
The traveler's ${origFlightLabel} from ${origin} to ${destAirport} is delayed by ${delayMinutes} minutes, exceeding the 45-minute connection window.
Trip: ${tripDoc.destination?.city ?? destCity}, ${tripDoc.destination?.country ?? ""}.

Write a calm, reassuring 2–3 sentence message that:
1. Acknowledges the delay on the ${origin} → ${destAirport} route by name
2. States you've already found an alternative option
3. Ends with a confident, action-oriented statement

Alternative available: ${altSummary}

Return ONLY the spoken message — no JSON, no bullets, no more than 3 sentences.`;

  let mascotMessage = "";
  try {
    const result = await geminiModel.generateContent(crisisPrompt);
    mascotMessage = result.response.text().trim();
  } catch {
    mascotMessage = alternative
      ? `Your ${origFlightLabel} from ${origin} to ${destAirport} is delayed by ${delayMinutes} minutes — past your connection window. I've found ${alternative.carrier} ${alternative.flightNumber} as an alternative.`
      : `Your ${origFlightLabel} from ${origin} to ${destAirport} is delayed by ${delayMinutes} minutes. Please check with the airline desk for rebooking options.`;
  }

  // ── Exception email draft (over-budget only) ──────────────────
  let exceptionDraft: { subject: string; body: string } | null = null;
  if (isOverBudget) {
    try {
      const tripForPrompt = {
        destination: {
          city: tripDoc.destination?.city ?? "",
          country: tripDoc.destination?.country ?? "",
        },
        dates: { departure, return: returnDate },
        budgetCapUsd: budgetCap,
        totalSpendUsd: currentSpend,
        receipts: [],
      };
      const prompt = buildExceptionRequestPrompt(
        tripForPrompt as unknown as Parameters<typeof buildExceptionRequestPrompt>[0],
        overageUsd
      );
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        exceptionDraft = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      }
    } catch {
      exceptionDraft = {
        subject: `Emergency Rebooking Exception — ${tripDoc.destination?.city ?? "Trip"}`,
        body: `Hi,\n\nI need approval for an emergency rebooking that exceeds the travel budget by $${overageUsd}. My original flight ${origFlightLabel} from ${origin} to ${destAirport} was delayed beyond the connection buffer, requiring an immediate alternative booking.\n\nPlease approve at your earliest convenience.\n\nThank you`,
      };
    }
  }

  return NextResponse.json({
    crisis: true,
    alternative,
    isOverBudget,
    overageUsd,
    mascotMessage,
    exceptionDraft,
  });
}
