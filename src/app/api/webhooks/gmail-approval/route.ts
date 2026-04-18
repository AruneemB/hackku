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
//   "gmailThreadId": "1234abcd5678efgh",
//   "managerReply": "Approved. Good trip planning!",
//   "approved": true
// }
//
// RESPONSE (200):
// { "success": true, "tripStatus": "approved" }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import Trip from "@/lib/mongodb/models/Trip"

// TODO: export async function POST(req: NextRequest) {
//   // Parse body: { tripId, approved, managerReply }
//   // Update trip: status = approved ? "approved" : "rejected"
//   //              approvalThread.status = approved ? "approved" : "rejected"
//   //              approvalThread.reason = managerReply (if rejected)
//   // Return success
// }

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "scaffold" });
}

export async function POST() {
  return NextResponse.json({ message: "scaffold" });
}
