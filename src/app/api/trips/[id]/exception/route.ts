// ============================================================
// API ROUTE: Exception Request (Frame 11)
// ROUTE: POST /api/trips/[id]/exception
// DESCRIPTION: Persists an in-trip budget exception request and
//   sends it to the manager via Gmail. Deliberately separate from
//   /approve, which handles pre-trip approval and sets trip status
//   to "pending_approval". This route does NOT change trip.status
//   — the trip must remain "active" while Kelli is travelling.
//
// REQUEST BODY:
// { "subject": "...", "body": "..." }
//
// RESPONSE (200):
// { "success": true }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";

type ExceptionRouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: ExceptionRouteContext) {
  const { id } = await context.params;
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
  // not a status transition. Gmail send will be wired when gmail.ts is implemented.
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
