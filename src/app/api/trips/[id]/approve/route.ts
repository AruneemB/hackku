// @ts-nocheck
// ============================================================
// API ROUTE: Send Approval Request (Frame 6)
// OWNER: Track C (Data & Integrations)
// ROUTE: POST /api/trips/[id]/approve
// DESCRIPTION: Drafts and sends the manager approval email
//   from Lockey's Gmail using the Google OAuth access token.
//   Updates trip status to "pending_approval" and stores the
//   Gmail thread ID for the Atlas Trigger to watch.
//
// REQUEST: (no body — reads selected bundle from trip doc)
//
// RESPONSE (200):
// {
//   "success": true,
//   "gmailThreadId": "1234abcd5678efgh",
//   "sentTo": "manager@lockton.com",
//   "subject": "Trip Approval Request: Milan, Sep 14-19"
// }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/google/oauth"
import { connectToDatabase } from "@/lib/mongodb/client"
import Trip from "@/lib/mongodb/models/Trip"
import { sendApprovalRequest } from "@/lib/google/gmail"

type ApproveRouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: ApproveRouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    if (!session.accessToken) return NextResponse.json({ error: "No access token" }, { status: 403 })

    const { id } = await context.params
    await connectToDatabase()

    // Atomically claim the "sending" slot — prevents duplicate emails on concurrent requests
    const trip = await Trip.findOneAndUpdate(
      { _id: id, "approvalThread.gmailThreadId": { $in: [null, undefined] }, selectedBundle: { $ne: null } },
      { $set: { "approvalThread.status": "sending" } },
      { new: true }
    )

    if (!trip) {
      // Either trip not found, no bundle selected, or another request already claimed it
      const existing = await Trip.findById(id).lean()
      if (!existing) return NextResponse.json({ error: "Trip not found" }, { status: 404 })
      if (!existing.selectedBundle) return NextResponse.json({ error: "No bundle selected" }, { status: 400 })
      // Already sent — return idempotent response
      return NextResponse.json({
        success: true,
        gmailThreadId: existing.approvalThread?.gmailThreadId,
        alreadySent: true,
      })
    }

    const fromEmail = session.user?.email ?? "me"
    const userName = session.user?.name ?? "Lockey"

    const threadId = await sendApprovalRequest(
      session.accessToken!,
      fromEmail,
      userName,
      trip.toObject(),
      trip.selectedBundle
    )

    await Trip.findByIdAndUpdate(id, {
      status: "pending_approval",
      "approvalThread.gmailThreadId": threadId,
      "approvalThread.status": "pending",
    })

    const managerEmail = process.env.MANAGER_EMAIL ?? fromEmail
    return NextResponse.json({
      success: true,
      gmailThreadId: threadId,
      sentTo: managerEmail,
    })
  } catch (err) {
    console.error("[approve]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Approval request failed" },
      { status: 500 }
    )
  }
}
