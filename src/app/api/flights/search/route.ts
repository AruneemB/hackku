import { NextRequest, NextResponse } from "next/server";
import { runFairGrid, FairGridParams } from "@/lib/flights/fairGrid";

/**
 * POST /api/flights/search
 * Body: { homeAirport, destination, targetDeparture, targetReturn, windowDays?, radiusMiles? }
 * Returns: Flight[] sorted by priceUsd
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      homeAirport,
      destination,
      targetDeparture,
      targetReturn,
      windowDays,
      radiusMiles,
    } = body;

    // Boundary Validation
    const errors: string[] = [];

    if (!homeAirport || typeof homeAirport !== "string") {
      errors.push("homeAirport is required and must be a string.");
    }
    if (!destination || typeof destination !== "string") {
      errors.push("destination is required and must be a string.");
    }

    if (!targetDeparture || isNaN(Date.parse(targetDeparture))) {
      errors.push("targetDeparture is required and must be a valid date string.");
    }
    if (!targetReturn || isNaN(Date.parse(targetReturn))) {
      errors.push("targetReturn is required and must be a valid date string.");
    }

    if (windowDays !== undefined && (typeof windowDays !== "number" || windowDays < 1)) {
      errors.push("windowDays must be a positive number.");
    }
    if (radiusMiles !== undefined && (typeof radiusMiles !== "number" || radiusMiles < 0)) {
      errors.push("radiusMiles must be a non-negative number.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const params: FairGridParams = {
      homeAirport,
      destination,
      targetDeparture: new Date(targetDeparture),
      targetReturn: new Date(targetReturn),
      windowDays,
      radiusMiles,
    };

    // runFairGrid already returns sorted results (priceUsd ascending)
    const flights = await runFairGrid(params);

    return NextResponse.json(flights);
  } catch (error) {
    console.error("Flight search API error:", error);
    return NextResponse.json(
      { message: "Internal server error during flight search." },
      { status: 500 }
    );
  }
}
