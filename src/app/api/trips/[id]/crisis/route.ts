// ============================================================
// API ROUTE: Crisis Detection + Rebooking
// ROUTE: GET /api/trips/[id]/crisis?flightNumber=AA2345
//
// Returns the crisis payload for CrisisAlert:
//   - alternativeFlight (from demo_alternatives collection or mock)
//   - isOverBudget (alternative price vs trip budgetCapUsd)
//   - exceptionDraft (Gemini email draft, only when isOverBudget)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import clientPromise from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";
import { geminiModel } from "@/lib/gemini/client";
import { buildCrisisPrompt, buildExceptionRequestPrompt } from "@/lib/gemini/prompts";

const CONNECTION_BUFFER_MINUTES = 45;

type CrisisRouteContext = { params: Promise<{ id: string }> };

// Decimal128 objects returned by Mongoose .lean() have a toString() method.
// parseFloat("123.45") works; parseFloat(Decimal128Instance) would return NaN.
function decimal128ToString(val: unknown, fallback: string): string {
  if (val == null) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && "toString" in (val as object)) {
    return (val as { toString(): string }).toString();
  }
  return fallback;
}

export async function GET(req: NextRequest, context: CrisisRouteContext) {
  const { id } = await context.params;
  const raw = req.nextUrl.searchParams.get("delayMinutes");
  const delayMinutes = Number.parseInt(raw ?? "0", 10);
  if (!Number.isFinite(delayMinutes) || delayMinutes <= CONNECTION_BUFFER_MINUTES) {
    return NextResponse.json({ crisis: false });
  }

  await connectToDatabase();
  const trip = await Trip.findById(id).lean();
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db("hackku");

  const tripDoc = trip as Record<string, unknown> & {
    destination?: { city?: string; country?: string };
    budgetCapUsd?: unknown;
    totalSpendUsd?: unknown;
    selectedBundle?: {
      totalCostUsd?: number;
      flight?: { outbound?: { flightNumber?: string; carrier?: string } };
      hotel?: { name?: string; nightlyRateUsd?: number };
    };
    dates?: { departure?: Date; return?: Date };
  };

  const destination = tripDoc.destination?.country ?? "IT";
  const altFlight = await db
    .collection("demo_alternatives")
    .findOne({ destinationCountry: destination });

  const alternative = altFlight
    ? {
        flightNumber: altFlight.flightNumber as string,
        carrier: altFlight.carrier as string,
        departureTime: altFlight.departureTime as string,
        arrivalTime: altFlight.arrivalTime as string,
        priceUsd: altFlight.priceUsd as number,
        origin: altFlight.origin as string,
        destination: altFlight.destination as string,
      }
    : null;

  const budgetCap = parseFloat(decimal128ToString(tripDoc.budgetCapUsd, "2800"));
  const altPrice = alternative?.priceUsd ?? 0;
  const currentSpend = parseFloat(decimal128ToString(tripDoc.totalSpendUsd, "0"));
  const isOverBudget = alternative ? currentSpend + altPrice > budgetCap : false;
  const overageUsd = isOverBudget ? Math.round(currentSpend + altPrice - budgetCap) : 0;

  // Use Gemini to generate the mascot's spoken crisis message (buildCrisisPrompt)
  let mascotMessage = "";
  try {
    const crisisPrompt = buildCrisisPrompt(
      delayMinutes,
      alternative ? [alternative] : []
    );
    const crisisResult = await geminiModel.generateContent(crisisPrompt);
    mascotMessage = crisisResult.response.text().trim();
  } catch {
    mascotMessage = alternative
      ? `Kelli, your flight is delayed by ${delayMinutes} minutes — past your connection window. I've found ${alternative.carrier} ${alternative.flightNumber} as an alternative.`
      : `Kelli, your flight is delayed by ${delayMinutes} minutes, which will cause you to miss your connection. Please check with the airline desk for options.`;
  }

  let exceptionDraft: { subject: string; body: string } | null = null;

  if (isOverBudget) {
    try {
      const prompt = buildExceptionRequestPrompt(
        {
          destination: { city: tripDoc.destination?.city ?? "", country: tripDoc.destination?.country ?? "" },
          dates: { departure: tripDoc.dates?.departure ?? new Date(), return: tripDoc.dates?.return ?? new Date() },
          budgetCapUsd: decimal128ToString(tripDoc.budgetCapUsd, "2800"),
          selectedBundle: tripDoc.selectedBundle
            ? {
                totalCostUsd: tripDoc.selectedBundle.totalCostUsd ?? 0,
                flight: { outbound: { flightNumber: tripDoc.selectedBundle.flight?.outbound?.flightNumber ?? "", carrier: tripDoc.selectedBundle.flight?.outbound?.carrier ?? "" } },
                hotel: { name: tripDoc.selectedBundle.hotel?.name ?? "", nightlyRateUsd: tripDoc.selectedBundle.hotel?.nightlyRateUsd ?? 0 },
              }
            : null,
        },
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
        body: `Hi,\n\nI need approval for an emergency rebooking that exceeds the travel budget by $${overageUsd}. My original flight was delayed beyond the connection buffer, requiring an immediate alternative booking.\n\nPlease approve at your earliest convenience.\n\nThank you,\nKelli Thompson`,
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
