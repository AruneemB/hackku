// ============================================================
// API ROUTE: Send Approval Request (Frame 6)
// OWNER: Track C (Data & Integrations)
// ROUTE: POST /api/trips/[id]/approve
// DESCRIPTION: Drafts and sends the manager approval email
//   from Kelli's Gmail using the Google OAuth access token.
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

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { getServerSession } from "next-auth"
// TODO: import { sendApprovalRequest } from "@/lib/google/gmail"
// TODO: import { getAccessToken } from "@/lib/google/oauth"

// TODO: export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   // 1. Get session + access token
//   // 2. Load trip + selected bundle from DB
//   // 3. sendApprovalRequest(accessToken, trip, bundle) → gmailThreadId
//   // 4. PATCH trip: { status: "pending_approval", approvalThread.gmailThreadId }
//   // 5. Return success + threadId
// }
