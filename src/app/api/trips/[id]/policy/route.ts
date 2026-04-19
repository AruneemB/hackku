// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { queryPolicyForTrip } from "@/lib/policy/vectorSearch";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";

type TripRouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/trips/[id]/policy
 * Fetch policy findings for a specific trip. If they don't exist, calculate them.
 */
export async function GET(req: NextRequest, context: TripRouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    
    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }

    // If findings don't exist, generate them
    if (!trip.policyFindings) {
      const findings = await queryPolicyForTrip(trip);
      trip.policyFindings = findings;
      await trip.save();
    }

    return NextResponse.json(trip.policyFindings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    console.error("Trip policy GET error:", error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

/**
 * POST /api/trips/[id]/policy
 * Force recalculate policy findings for a specific trip, optionally with costs.
 */
export async function POST(req: NextRequest, context: TripRouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { hotelNightlyRateUsd, flightCostUsd } = body;

    await connectToDatabase();
    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }

    const findings = await queryPolicyForTrip(trip, {
      hotelNightlyRateUsd,
      flightCostUsd
    });

    trip.policyFindings = findings;
    await trip.save();

    return NextResponse.json(findings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    console.error("Trip policy POST error:", error);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
