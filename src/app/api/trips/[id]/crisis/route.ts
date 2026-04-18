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
import { buildExceptionRequestPrompt } from "@/lib/gemini/prompts";

const CONNECTION_BUFFER_MINUTES = 45;

type CrisisRouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: CrisisRouteContext) {
  const { id } = await context.params;
  const delayMinutes = parseInt(req.nextUrl.searchParams.get("delayMinutes") ?? "0", 10);

  if (delayMinutes <= CONNECTION_BUFFER_MINUTES) {
    return NextResponse.json({ crisis: false });
  }

  await connectToDatabase();
  const trip = await Trip.findById(id).lean();
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const mongoClient = await clientPromise;
  const db = mongoClient.db("hackku");

  const destination = (trip as { destination?: { country?: string } }).destination?.country ?? "IT";
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

  const budgetCap = parseFloat((trip as { budgetCapUsd?: string }).budgetCapUsd ?? "2800");
  const altPrice = alternative?.priceUsd ?? 0;
  const currentSpend = parseFloat((trip as { totalSpendUsd?: string }).totalSpendUsd ?? "0");
  const isOverBudget = alternative ? currentSpend + altPrice > budgetCap : false;
  const overageUsd = isOverBudget ? Math.round(currentSpend + altPrice - budgetCap) : 0;

  let exceptionDraft: { subject: string; body: string } | null = null;

  if (isOverBudget) {
    try {
      const prompt = buildExceptionRequestPrompt(
        trip as Parameters<typeof buildExceptionRequestPrompt>[0],
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
        subject: `Emergency Rebooking Exception — ${(trip as { destination?: { city?: string } }).destination?.city ?? "Trip"}`,
        body: `Hi,\n\nI need approval for an emergency rebooking that exceeds the travel budget by $${overageUsd}. My original flight was delayed beyond the connection buffer, requiring an immediate alternative booking.\n\nPlease approve at your earliest convenience.\n\nThank you,\nKelli Thompson`,
      };
    }
  }

  return NextResponse.json({
    crisis: true,
    alternative,
    isOverBudget,
    overageUsd,
    exceptionDraft,
  });
}
