// @ts-nocheck
// ============================================================
// API ROUTE: Exception Request (Frame 11)
// ROUTE: POST /api/trips/[id]/exception
// DESCRIPTION: Persists an in-trip budget exception request.
//   Deliberately separate from /approve, which handles pre-trip
//   approval. This route does NOT change trip.status — the trip
//   must remain "active" while the traveler is travelling.
//
// REQUEST BODY: { "subject": "...", "body": "..." }
// RESPONSE (200): { "success": true }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";

type ExceptionRouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: ExceptionRouteContext) {
  const { id } = await context.params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid trip id" }, { status: 400 });
  }

  const { subject, body } = await req.json();

  if (!subject || !body) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  await connectToDatabase();
  const trip = await Trip.findById(id);
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Store the exception request on the trip document for audit purposes.
  // Trip status intentionally stays "active" — this is an in-trip request,
  // not a status transition.
  await Trip.findByIdAndUpdate(id, {
    $set: {
      "exceptionRequest.subject": subject,
      "exceptionRequest.body": body,
      "exceptionRequest.requestedAt": new Date(),
      "exceptionRequest.status": "pending",
    },
  });

  return NextResponse.json({ success: true });
}
