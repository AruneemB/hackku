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

// TODO: import { google } from "googleapis"

// TODO: export async function sendApprovalRequest(
//   accessToken: string,
//   trip: Trip,
//   bundle: TripBundle
// ): Promise<string> {  // returns Gmail thread ID
//
//   // Build email body with trip rationale:
//   // Subject: "Trip Approval Request: Milan, Sep 14-19"
//   // Body: "Hi [manager], I'm requesting approval for the following trip...
//   //   Flight: AA2345 MCI→MXP ($1,240) — selected for lowest cost in 5-day window
//   //   Hotel: Marriott Milan ($185/night) — preferred vendor, 0.8km from client
//   //   Total: $1,980 (within $2,800 budget)"
//
//   // Use Gmail API to create + send the draft
//   // Return the threadId so Atlas Trigger can watch for manager reply
// }

// TODO: export async function scanForReceipts(
//   accessToken: string,
//   afterDate: Date
// ): Promise<GeminiReceiptExtraction[]> {
//   // Frame 15: searches Gmail for receipts/folios sent after trip start
//   // Queries: label:inbox after:[date] (hotel OR receipt OR folio)
//   // EXAMPLE RETURN:
//   // [{ merchant: "Marriott Milan", amount: "925.00", currency: "USD", ... }]
// }
