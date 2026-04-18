// ============================================================
// LIB: Gmail API
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Handles Frame 6 — drafts and sends the manager
//   approval request from Kelli's Gmail using Google OAuth.
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

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
  const managerEmail = process.env.MANAGER_EMAIL ?? fromEmail
  const dest = `${trip.destination.city}, ${trip.destination.country}`
  const dates = `${fmtDate(trip.dates.departure)} – ${fmtDate(trip.dates.return)}`
  const subject = `Trip Approval Request: ${dest}, ${dates}`

  const flightLine = bundle.flight
    ? `  Flight: ${bundle.flight.outbound?.carrier ?? ""} ${bundle.flight.outbound?.flightNumber ?? ""} — $${bundle.flight.priceUsd} (selected for ${bundle.description})`
    : "  Flight: pending selection"

  const hotelLine = bundle.hotel
    ? `  Hotel:  ${bundle.hotel.name} — $${bundle.hotel.nightlyRateUsd}/night (${bundle.hotel.distanceFromOfficeKm} km from office)`
    : "  Hotel: pending selection"

  const body = `Hi,

${userName} is requesting manager approval for the following business trip:

Destination: ${dest}
Dates: ${dates}
Bundle: Option ${bundle.label} — ${bundle.description}

${flightLine}
${hotelLine}
  Total:  $${bundle.totalCostUsd} (budget cap: $${trip.budgetCapUsd})
${bundle.complianceFlags.length ? `\n  ⚠️  Policy flags: ${bundle.complianceFlags.join(", ")}` : ""}

Please reply APPROVED or REJECTED (with optional reason).

Thank you,
Lockey — AI Travel Concierge`

  const { threadId } = await sendEmail(accessToken, managerEmail, fromEmail, subject, body)
  return threadId
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
