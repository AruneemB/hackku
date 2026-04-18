// ============================================================
// API ROUTE: Single Trip
// OWNER: Track C (Data & Integrations)
// ROUTE: /api/trips/[id]
//
// GET    → Fetch trip by ID (with all nested data)
// PATCH  → Update trip fields (status, selectedBundle, etc.)
// DELETE → Hard delete (admin/debug only)
//
// PATCH REQUEST BODY (examples):
//   { "status": "active" }
//   { "selectedBundle": { "label": "B", "flight": {...}, "hotel": {...} } }
//
// GET RESPONSE:
// {
//   "_id": "665a2b3c4d5e6f7a8b9c0d1e",
//   "status": "approved",
//   "destination": { "city": "Milan", "country": "IT" },
//   "selectedBundle": { "label": "B", "totalCostUsd": 1980 },
//   "policyFindings": { "visa": {...}, "hotelNightlyCapUsd": 200 },
//   "approvalThread": { "gmailThreadId": "abc123", "status": "approved" }
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import Trip from "@/lib/mongodb/models/Trip"

// TODO: export async function GET(req: NextRequest, { params }: { params: { id: string } }) {}
// TODO: export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {}
// TODO: export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {}

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";

type TripRouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/trips/[id]
 */
export async function GET(req: NextRequest, context: TripRouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const trip = await Trip.findById(id);
    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json(trip);
  } catch (error) {
    console.error("Trip GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/trips/[id]
 */
export async function PATCH(req: NextRequest, context: TripRouteContext) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const body = await req.json();
    
    const trip = await Trip.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json(trip);
  } catch (error) {
    console.error("Trip PATCH error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
