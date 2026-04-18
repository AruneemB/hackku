// ============================================================
// API ROUTE: Gmail Send
// ROUTE: POST /api/auth/gmail-send
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Sends an email via Gmail API using the stored
//   OAuth access token. Message is encoded as RFC 2822 /
//   base64url as required by the Gmail REST API.
//   Used by the /auth test page; will be called by gmail.ts
//   sendApprovalRequest() during trip approval flow.
//
// REQUEST BODY:
//   { "to": string, "subject": string, "body": string }
//
// RESPONSE (200):
//   { "threadId": string, "messageId": string }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/google/oauth"

function buildRfc2822(to: string, from: string, subject: string, body: string): string {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join("\r\n")

  // base64url encode (Gmail API requirement)
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }
  if (!session.accessToken) {
    return NextResponse.json({ error: "No access token in session" }, { status: 403 })
  }

  const { to, subject, body } = await req.json()
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "to, subject, and body are required" }, { status: 400 })
  }

  const raw = buildRfc2822(to, session.user?.email ?? "me", subject, body)

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: err?.error?.message ?? `Gmail API ${res.status}` },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json({ threadId: data.threadId, messageId: data.id })
}
