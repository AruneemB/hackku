// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";

type SummaryRouteContext = { params: Promise<{ id: string }> };

function extractFlightCost(flights: unknown[]): { amountUsd: number; meta: string } {
  if (!flights || !flights.length) return { amountUsd: 0, meta: "" };
  const f = flights[0] as Record<string, unknown>;
  let amountUsd = 0;
  let meta = "";

  // 1. Live Flight shape: { priceUsd, outbound: { flightNumber, origin, destination } }
  if (typeof f.priceUsd === "number" && f.priceUsd > 0) {
    amountUsd = f.priceUsd;
    const ob = f.outbound as Record<string, string> | undefined;
    if (ob?.flightNumber) meta = `${ob.flightNumber} · ${ob.origin} → ${ob.destination}`;
  }

  // 2. Demo DisplayFlightGroup shape: { returns: [{ totalPriceUsd }] }
  if (amountUsd === 0 && Array.isArray(f.returns) && f.returns.length > 0) {
    const r = f.returns[0] as Record<string, unknown>;
    amountUsd = typeof r.totalPriceUsd === "number" ? r.totalPriceUsd : 0;
    if (typeof f.route === "string" && typeof f.flightNumber === "string") {
      meta = `${f.flightNumber} · ${f.route}`;
    }
  }

  // 3. Simple fallback
  if (amountUsd === 0 && typeof f.totalPriceUsd === "number") amountUsd = f.totalPriceUsd;

  return { amountUsd, meta };
}

function extractHotelCost(
  hotels: unknown[],
  nights: number
): { amountUsd: number; meta: string } {
  if (!hotels || !hotels.length) return { amountUsd: 0, meta: "" };
  const h = hotels[0] as Record<string, unknown>;

  // 1. Live Hotel shape: { totalCostUsd, name }
  if (typeof h.totalCostUsd === "number" && h.totalCostUsd > 0) {
    return { amountUsd: h.totalCostUsd, meta: typeof h.name === "string" ? h.name : "" };
  }

  // 2. Demo hotel shape: { nightlyRateUsd, name }
  const nightly = (h.nightlyRateUsd ?? h.pricePerNightUsd) as number | undefined;
  if (typeof nightly === "number") {
    return {
      amountUsd: nightly * nights,
      meta: typeof h.name === "string" ? h.name : "",
    };
  }

  return { amountUsd: 0, meta: typeof h.name === "string" ? h.name : "" };
}

export async function GET(_req: NextRequest, context: SummaryRouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const trip = await Trip.findById(id).lean() as Record<string, unknown> | null;

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }

    const dates = trip.dates as { departure: unknown; return: unknown } | undefined;
    const departure = dates?.departure ? new Date(dates.departure as string) : new Date();
    const returnDate = dates?.return ? new Date(dates.return as string) : new Date();
    const nights = Math.max(1, Math.round((returnDate.getTime() - departure.getTime()) / 86_400_000));

    const flights = Array.isArray(trip.flights) ? (trip.flights as unknown[]) : [];
    const hotels = Array.isArray(trip.hotels) ? (trip.hotels as unknown[]) : [];
    const receipts = Array.isArray(trip.receipts) ? (trip.receipts as Record<string, unknown>[]) : [];

    const flightData = extractFlightCost(flights);
    const hotelData = extractHotelCost(hotels, nights);

    const receiptsByCategory: Record<string, number> = {};
    for (const r of receipts) {
      const cat = typeof r.category === "string" ? r.category : "other";
      const raw = r.total;
      const amount = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
      if (Number.isFinite(amount)) {
        receiptsByCategory[cat] = (receiptsByCategory[cat] ?? 0) + amount;
      }
    }

    const mealTotal = receiptsByCategory.meal ?? 0;
    const transportTotal = receiptsByCategory.transport ?? 0;
    const otherTotal = Object.entries(receiptsByCategory)
      .filter(([k]) => k !== "meal" && k !== "transport")
      .reduce((s, [, v]) => s + v, 0);

    // ALWAYS compute live instead of relying on potentially stale trip.totalSpendUsd
    const totalSpendUsd = flightData.amountUsd + hotelData.amountUsd + mealTotal + transportTotal + otherTotal;
    const budgetCapUsd = typeof trip.budgetCapUsd === "number" && trip.budgetCapUsd > 0 ? trip.budgetCapUsd : 7500;

    const categories = [
      { name: "Flights", icon: "✈️", amountUsd: flightData.amountUsd, meta: flightData.meta },
      { name: `Hotel (${nights} night${nights !== 1 ? "s" : ""})`, icon: "🏨", amountUsd: hotelData.amountUsd, meta: hotelData.meta },
      { name: "Meals", icon: "🍽️", amountUsd: mealTotal, meta: receipts.length > 0 ? `${receipts.length} receipt${receipts.length !== 1 ? "s" : ""} logged` : "" },
      { name: "Transport", icon: "🚕", amountUsd: transportTotal, meta: "" },
      ...(otherTotal > 0 ? [{ name: "Other", icon: "💼", amountUsd: otherTotal, meta: "" }] : []),
    ];

    return NextResponse.json({
      totalSpendUsd,
      budgetCapUsd,
      nights,
      receiptsCount: receipts.length,
      categories,
    });
  } catch (error) {
    console.error("Summary GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
