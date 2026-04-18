// ============================================================
// API ROUTE: Gmail Approval Webhook (Atlas Trigger target)
// OWNER: Track C (Data & Integrations)
// ROUTE: POST /api/webhooks/gmail-approval
// DESCRIPTION: Called by a MongoDB Atlas Trigger that watches
//   the trips collection for approval status changes.
//
//   ALTERNATIVE APPROACH (simpler for hackathon):
//   Instead of a true Atlas Trigger, poll Gmail every 30s
//   for a reply to the approval thread and call this endpoint
//   manually when a reply is detected.
//
//   In both cases, this endpoint:
//   1. Parses the manager's reply (approved/rejected + reason)
//   2. PATCHes trip.approvalThread.status
//   3. PATCHes trip.status to "approved" or "rejected"
//
// REQUEST BODY (from Atlas Trigger or polling logic):
// {
//   "tripId": "665a2b3c4d5e6f7a8b9c0d1e",
//   "approved": true,
//   "managerReply": "Approved. Good trip planning!"
// }
//
// RESPONSE (200):
// { "success": true, "tripStatus": "approved" }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/client"
import Trip from "@/lib/mongodb/models/Trip"

export async function POST(req: NextRequest) {
  try {
    const { tripId, approved, managerReply } = await req.json()
    if (!tripId) return NextResponse.json({ error: "tripId required" }, { status: 400 })

    await connectToDatabase()

    const newStatus = approved ? "approved" : "rejected"
    const trip = await Trip.findByIdAndUpdate(
      tripId,
      {
        status: newStatus,
        "approvalThread.status": newStatus,
        "approvalThread.reason": managerReply ?? null,
      },
      { new: true }
    )

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    return NextResponse.json({ success: true, tripStatus: newStatus })
  } catch (err) {
    console.error("[gmail-approval]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    )
  }
}
