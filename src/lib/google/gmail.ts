// ============================================================
// LIB: Gmail API
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Handles Frame 6 — drafts and sends the manager
//   approval request from Lockey's Gmail using Google OAuth.
//   Also scans Gmail for digital receipts in Frame 15.
//
//   OAuth tokens are stored in MongoDB (NextAuth adapter).
//   The approval email includes flight/hotel logic so the
//   manager understands WHY the choices were made.
//
// SCOPES REQUIRED:
//   https://www.googleapis.com/auth/gmail.compose
//   https://www.googleapis.com/auth/gmail.readonly  (for Frame 15)
//
// USAGE:
//   const threadId = await sendApprovalRequest(accessToken, trip, bundle)
// ============================================================
import type { Trip, TripBundle } from "@/types"
import { geminiModel } from "@/lib/gemini/client"

const DEFAULT_MANAGER_EMAIL = "micahtid@gmail.com"

export function getManagerEmail(): string {
  return process.env.MANAGER_EMAIL ?? process.env.NEXT_PUBLIC_MANAGER_EMAIL ?? DEFAULT_MANAGER_EMAIL
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })
}

function sanitizeHeader(value: string): string {
  // Strip CR, LF, and NUL to prevent header injection
  return value.replace(/[\r\n\0]/g, "")
}

function buildRfc2822(to: string, from: string, subject: string, body: string): string {
  const message = [
    `From: ${sanitizeHeader(from)}`,
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join("\r\n")

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function sendEmail(
  accessToken: string,
  to: string,
  from: string,
  subject: string,
  body: string
): Promise<{ threadId: string; messageId: string }> {
  const raw = buildRfc2822(to, from, subject, body)
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gmail API ${res.status}`)
  }
  const data = await res.json()
  return { threadId: data.threadId, messageId: data.id }
}

export async function sendApprovalRequest(
  accessToken: string,
  fromEmail: string,
  userName: string,
  trip: Trip,
  bundle: TripBundle
): Promise<string> {
  const managerEmail = getManagerEmail()
  const dest = `${trip.destination.city}, ${trip.destination.country}`
  const dates = `${fmtDate(trip.dates.departure)} – ${fmtDate(trip.dates.return)}`
  const subject = `Trip Approval Request: ${dest}, ${dates}`

  const f = bundle.flight ?? null
  const h = bundle.hotel ?? null

  const flightBlock = f
    ? [
      `  Outbound: ${f.outbound.carrier} ${f.outbound.flightNumber} — ${f.outbound.origin} → ${f.outbound.destination}`,
      `    Departs: ${fmtDateTime(f.outbound.departureTime)}, Arrives: ${fmtDateTime(f.outbound.arrivalTime)}`,
      f.inbound
        ? `  Return:   ${f.inbound.carrier} ${f.inbound.flightNumber} — ${f.inbound.origin} → ${f.inbound.destination}`
        : `  Return:   not included in this bundle`,
      f.inbound
        ? `    Departs: ${fmtDateTime(f.inbound.departureTime)}, Arrives: ${fmtDateTime(f.inbound.arrivalTime)}`
        : "",
      `  Flight Total: $${f.priceUsd}`,
    ].filter(Boolean).join("\n")
    : "  Flight: not selected"

  const hotelBlock = h
    ? [
      `  Hotel: ${h.name}`,
      `  Address: ${h.address}`,
      `  Check-in: ${fmtDate(h.checkIn)}, Check-out: ${fmtDate(h.checkOut)}`,
      `  Rate: $${h.nightlyRateUsd}/night (Total: $${h.totalCostUsd})`,
      h.preferred ? "  (Preferred vendor)" : "",
      h.overPolicyCap ? `  ⚠ Over policy cap by $${h.excessAboveCapUsd}` : "",
    ].filter(Boolean).join("\n")
    : "  Hotel: not selected"

  const prompt = `You are Lockey, an AI Travel Concierge. Draft a short, professional email to a manager requesting approval for a business trip. Use ONLY the details provided below — do not invent or infer any facts.
Trip Details:
- Traveler: ${userName}
- Destination: ${dest}
- Trip Dates: ${dates}
- Bundle Selected: Option ${bundle.label} — ${bundle.description}

Flight:
${flightBlock}

Hotel:
${hotelBlock}

- Total Bundle Cost: $${bundle.totalCostUsd} (Budget Cap: $${trip.budgetCapUsd})
- Policy Flags: ${bundle.complianceFlags.length ? bundle.complianceFlags.join(", ") : "None"}

CRITICAL INSTRUCTION: If you do not know the manager's name, the company name, or any other specific detail not listed above, use the word "PLACEHOLDER" in all caps. Do not hallucinate names or dates.
The email should ask the manager to reply APPROVED or REJECTED (with an optional reason). Output only the email body text.`

  const result = await geminiModel.generateContent(prompt)
  const body = result.response.text()

  const { threadId } = await sendEmail(accessToken, managerEmail, fromEmail, subject, body)
  return threadId
}

export async function parseManagerReplyWithGemini(replyBody: string): Promise<{ status: "approved" | "rejected", flaggedItems: string[], reason: string }> {
  const prompt = `You are an AI assistant parsing a manager's reply to a travel approval request.
Analyze the following email reply from the manager.
Determine if the trip is "approved" or "rejected".
If rejected, identify the "flaggedItems" (e.g. ["hotel"], ["flight"], or ["hotel", "flight", "budget"]).
Extract the reason for rejection, if any.

Email Reply:
"""
${replyBody}
"""

Output valid JSON ONLY in this exact format, with no markdown code blocks:
{
  "status": "approved" | "rejected",
  "flaggedItems": ["hotel", "flight"],
  "reason": "Hotel too expensive"
}`

  const result = await geminiModel.generateContent(prompt)
  let text = result.response.text()
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim()
  try {
    return JSON.parse(text)
  } catch (err) {
    return { status: "approved", flaggedItems: [], reason: "" }
  }
}

export async function getMessageBody(accessToken: string, messageId: string) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error("Failed to fetch message")
  const data = await res.json()
  let body = data.snippet || ""
  if (data.payload?.parts) {
    const textPart = data.payload.parts.find((p: any) => p.mimeType === "text/plain")
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString()
    }
  }
  return body
}

export async function scanForReceipts(
  accessToken: string,
  afterDate: Date
): Promise<{ subject: string; snippet: string; date: string }[]> {
  const afterSec = Math.floor(afterDate.getTime() / 1000)
  const query = encodeURIComponent(`after:${afterSec} (receipt OR folio OR invoice)`)
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  if (!data.messages?.length) return []

  const details = await Promise.all(
    data.messages.slice(0, 5).map(async (msg: { id: string }) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!r.ok) return null
      const m = await r.json()
      const headers: { name: string; value: string }[] = m.payload?.headers ?? []
      return {
        subject: headers.find((h) => h.name === "Subject")?.value ?? "(no subject)",
        snippet: m.snippet ?? "",
        date: headers.find((h) => h.name === "Date")?.value ?? "",
      }
    })
  )

  return details.filter(Boolean) as { subject: string; snippet: string; date: string }[]
}
