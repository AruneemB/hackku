// ============================================================
// API ROUTE: Gmail Poll Approval
// ROUTE: GET /api/gmail/poll-approval
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Polls Gmail for the latest email from MANAGER_EMAIL.
//   Called every 5 seconds from Frame 7 (ApprovalPolling).
//   Uses the user's stored OAuth access token to search their
//   Gmail inbox for any message sent FROM the manager's email.
//   Once found, the body is extracted and parsed by Gemini to
//   determine whether the itinerary is approved, rejected, or
//   needs specific revisions (hotel/flight/dates changes).
//
// RESPONSE (200):
//   { found: false } — no message yet from manager
//   {
//     found: true,
//     status: "approved" | "rejected",
//     reason: string,
//     flaggedItems: string[],
//     changes: {
//       hotel?: string,    // e.g. "switch to AC Hotel Milan"
//       flight?: string,   // e.g. "choose cheaper option"
//       dates?: string,    // e.g. "shorten trip by 1 day"
//     },
//     snippet: string,    // short preview of manager email
//   }
// ============================================================

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/google/oauth"
import { getManagerEmail, parseManagerReplyWithGemini } from "@/lib/google/gmail"

async function getAccessToken(session: Awaited<ReturnType<typeof getServerSession>>): Promise<string | null> {
  if (!session) return null
  // session.accessToken is populated by the NextAuth google provider
  return (session as any).accessToken ?? null
}

async function fetchLatestFromManager(
  accessToken: string,
  managerEmail: string,
  sinceUnixSeconds: number | null,
): Promise<string | null> {
  // Search for the most recent email FROM the manager email address
  // Optional `after:` filter restricts to replies sent after a known timestamp,
  // so a stale prior reply isn't mistaken for an answer to a fresh request.
  const filterParts = [`from:${managerEmail}`]
  if (sinceUnixSeconds && Number.isFinite(sinceUnixSeconds)) {
    filterParts.push(`after:${Math.floor(sinceUnixSeconds)}`)
  }
  const query = encodeURIComponent(filterParts.join(" "))
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!listRes.ok) return null

  const listData = await listRes.json()
  if (!listData.messages?.length) return null

  const messageId: string = listData.messages[0].id

  // Fetch the full message body
  const msgRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!msgRes.ok) return null

  const msgData = await msgRes.json()

  // Extract plain text body
  let body: string = msgData.snippet ?? ""
  const payload = msgData.payload

  function extractText(part: any): string {
    if (part?.mimeType === "text/plain" && part?.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8")
    }
    if (part?.parts) {
      for (const subPart of part.parts) {
        const text = extractText(subPart)
        if (text) return text
      }
    }
    return ""
  }

  const extracted = extractText(payload)
  if (extracted) body = extracted

  return body || null
}

async function parseItineraryChangesWithGemini(replyBody: string): Promise<{
  status: "approved" | "rejected"
  reason: string
  flaggedItems: string[]
  changes: { hotel?: string; flight?: string; dates?: string; budget?: string }
}> {
  const { geminiModel } = await import("@/lib/gemini/client")

  const prompt = `You are an AI assistant analyzing a manager's reply to a business travel approval request.

Email Reply:
"""
${replyBody}
"""

Determine:
1. Is the trip approved or rejected?
2. What specific changes does the manager want (if rejected)?

Output valid JSON ONLY in this exact format, no markdown:
{
  "status": "approved" | "rejected",
  "reason": "Short summary of the manager's decision",
  "flaggedItems": ["hotel", "flight", "budget", "dates"],
  "changes": {
    "hotel": "Specific hotel change instruction, if any (e.g. 'Switch to a hotel under $200/night')",
    "flight": "Specific flight change instruction, if any",
    "dates": "Specific date change instruction, if any",
    "budget": "Specific budget guidance, if any"
  }
}

If the trip is approved, flaggedItems should be [] and changes should be {}.
Only include keys in changes that the manager explicitly mentioned.`

  const result = await geminiModel.generateContent(prompt)
  const text = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim()

  try {
    return JSON.parse(text)
  } catch {
    // Fallback: use simple parser
    const parsed = await parseManagerReplyWithGemini(replyBody)
    return { ...parsed, changes: {} }
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const accessToken = await getAccessToken(session)

    const managerEmail = getManagerEmail()

    if (!accessToken) {
      // No OAuth token — return a demo/mock response for testing without login
      // This allows the demo to proceed even when Gmail is not connected
      return NextResponse.json({ found: false, noAuth: true })
    }

    const sinceParam = new URL(req.url).searchParams.get("since")
    const sinceMs = sinceParam ? Number.parseInt(sinceParam, 10) : null
    const sinceUnixSeconds = sinceMs && Number.isFinite(sinceMs) ? Math.floor(sinceMs / 1000) : null

    const emailBody = await fetchLatestFromManager(accessToken, managerEmail, sinceUnixSeconds)

    if (!emailBody) {
      return NextResponse.json({ found: false })
    }

    const parsed = await parseItineraryChangesWithGemini(emailBody)

    return NextResponse.json({
      found: true,
      status: parsed.status,
      reason: parsed.reason,
      flaggedItems: parsed.flaggedItems,
      changes: parsed.changes,
      snippet: emailBody.slice(0, 200),
    })
  } catch (err) {
    console.error("[poll-approval] Error:", err)
    return NextResponse.json({ error: "Polling failed", found: false }, { status: 500 })
  }
}
