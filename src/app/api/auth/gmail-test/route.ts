// ============================================================
// API ROUTE: Gmail Connectivity Test
// ROUTE: GET /api/auth/gmail-test
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Standalone test endpoint for the /auth page.
//   Verifies that the stored OAuth access token has the required
//   Gmail scopes by fetching the last 5 inbox message subjects.
//   Uses the Gmail REST API directly (no googleapis SDK needed).
//
// RESPONSE (200):
//   { "email": string, "messages": [{ "id", "subject", "from", "date" }] }
// ============================================================

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/google/oauth"

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me"

async function gmailFetch(path: string, accessToken: string) {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gmail API ${res.status}`)
  }
  return res.json()
}

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }
  if (!session.accessToken) {
    return NextResponse.json({ error: "No access token in session" }, { status: 403 })
  }

  try {
    // Fetch last 5 inbox messages
    const list = await gmailFetch(
      "/messages?maxResults=5&labelIds=INBOX",
      session.accessToken
    )

    const messageIds: string[] = (list.messages ?? []).map((m: { id: string }) => m.id)

    // Fetch subject + from + date for each
    const messages = await Promise.all(
      messageIds.map(async (id) => {
        const msg = await gmailFetch(
          `/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          session.accessToken
        )
        const headers: { name: string; value: string }[] = msg.payload?.headers ?? []
        const get = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ""
        return { id, subject: get("Subject"), from: get("From"), date: get("Date") }
      })
    )

    return NextResponse.json({ email: session.user?.email, messages })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
