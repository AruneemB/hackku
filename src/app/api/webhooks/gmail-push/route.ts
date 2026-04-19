import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { connectToDatabase } from "@/lib/mongodb/client"
import Trip from "@/lib/mongodb/models/Trip"
import { parseManagerReplyWithGemini } from "@/lib/google/gmail"

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@localhost",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
)

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log("[gmail-push] Received webhook payload");

    // In a real Pub/Sub webhook, data is inside `payload.message.data` (base64 encoded)
    // For this demo, we can also extract `tripId`, `managerReplyText`, and `pushSubscription`
    // directly if simulating via a REST client.
    let tripId = payload.tripId
    let managerReplyText = payload.managerReplyText
    const pushSubscription = payload.pushSubscription // The client's PushSubscription object

    // If it's a real Google Pub/Sub Ping:
    if (payload.message && payload.message.data) {
       const decoded = Buffer.from(payload.message.data, 'base64').toString('utf-8')
       console.log("[gmail-push] Decoded Pub/Sub data:", decoded)
       
       // Note: To fully integrate with Google Pub/Sub, you'd extract the historyId here, 
       // fetch the user's OAuth token from the DB, and use the standard Gmail API 
       // (users.messages.list) to find the text of the latest unread message in the thread.
       // For hackathon simplicity, we fallback to direct simulation if not found.
       try {
         const parsed = JSON.parse(decoded)
         tripId = tripId || parsed.tripId
         managerReplyText = managerReplyText || parsed.managerReplyText
       } catch (e) {
         // ignore
       }
    }

    if (!tripId) {
      return NextResponse.json({ error: "No tripId provided" }, { status: 400 })
    }

    await connectToDatabase()

    // 1. Parse manager reply with Gemini
    const analysis = await parseManagerReplyWithGemini(managerReplyText || "The trip is rejected. The flight is too expensive.")
    console.log("[gmail-push] Gemini Analysis:", analysis)

    // 2. Update MongoDB (Wrapped in try/catch to bypass Hackathon WiFi DNS/MongoDB SRV blocks)
    try {
      const trip = await Trip.findByIdAndUpdate(
        tripId,
        {
          status: analysis.status === "approved" ? "approved" : "rejected",
          "approvalThread.status": analysis.status,
          "approvalThread.reason": analysis.reason,
          "approvalThread.flaggedItems": analysis.flaggedItems,
        },
        { new: true }
      )
      if (!trip && tripId !== "609cabc12345678901234567") { // ignore dummy mock trip
        console.warn("[gmail-push] Trip not found in DB.");
      }
    } catch (dbErr) {
      console.warn("[gmail-push] MongoDB update failed (likely Hackathon WiFi blocking SRV/port 27017). Skipping database update and proceeding to Push Notification.", dbErr);
    }

    // 3. Send Web Push Notification to the user's device
    if (pushSubscription) {
      const notificationPayload = JSON.stringify({
        title: analysis.status === "approved" ? "Trip Approved!" : "Trip Rejected",
        body: analysis.reason || (analysis.status === "approved" ? "You're all set." : "Action required."),
        url: "/demo?frame=" + (analysis.status === "approved" ? "8" : "7") 
      })

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload)
        console.log("[gmail-push] Push notification sent successfully.")
      } catch (pushErr) {
        console.error("[gmail-push] Error sending push notification:", pushErr)
      }
    }

    return NextResponse.json({ success: true, analysis, warning: "DB Update Skipped due to network" })
  } catch (err) {
    console.error("[gmail-push] Critical Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing failed" },
      { status: 500 }
    )
  }
}
