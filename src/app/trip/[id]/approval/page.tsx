// ============================================================
// PAGE: Approval Flow
// OWNER: Track A (Frontend & UX)
// ROUTE: /trip/[id]/approval
// DESCRIPTION: Handles Frames 6-7. When first loaded with
//   a "draft" bundle selected, triggers the Gmail approval
//   email send via POST /api/trips/[id]/approve.
//   Then shows ApprovalStatus which polls for manager reply.
//   If rejected, renders RejectionRecovery.
//
// FRAME 6: Send approval email → show "Waiting..." state
// FRAME 7: Status updates → approved (excited) or rejected (empathetic)
// ============================================================

"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ApprovalStatus } from "@/components/approval/ApprovalStatus"
import { RejectionRecovery } from "@/components/approval/RejectionRecovery"
import { useTrip } from "@/hooks/useTrip"
import { useMascot } from "@/hooks/useMascot"
import { Mascot } from "@/components/mascot/Mascot"

export default function ApprovalPage() {
  const params  = useParams()
  const router  = useRouter()
  const tripId  = params.id as string
  const { data: session } = useSession()
  const { trip, isLoading } = useTrip(tripId)
  const { say, setThinking } = useMascot()

  const [sendState, setSendState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)

  const sendApprovalEmail = useCallback(async () => {
    setSendState("sending")
    setThinking(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/approve`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send approval email")

      setSentTo(data.sentTo)
      setSendState("sent")

      if (data.alreadySent) {
        void say("Your approval request was already sent. Checking for a reply…", "neutral")
      } else {
        void say(
          `I've sent your trip approval request to your manager. I'll let you know as soon as they reply!`,
          "excited"
        )
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed")
      setSendState("error")
      void say("I had trouble sending the approval email. Please check your sign-in and try again.", "empathetic")
    } finally {
      setThinking(false)
    }
  }, [tripId, say, setThinking])

  // Send on mount once trip is loaded and has a bundle selected
  useEffect(() => {
    if (!trip || sendState !== "idle") return
    if (!trip.selectedBundle) {
      void say("It looks like you haven't selected a bundle yet. Go back and choose one.", "empathetic")
      return
    }
    void sendApprovalEmail()
  }, [trip, sendState, sendApprovalEmail, say])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Trip not found</p>
      </div>
    )
  }

  const userName = session?.user?.name ?? "Traveler"

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Approval</h1>
        <p className="text-sm text-gray-500 mt-1">
          Hi {userName} — requesting approval for {trip.destination.city}, {trip.destination.country}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">

          {/* Selected bundle summary */}
          {trip.selectedBundle && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm">
              <p className="font-semibold text-gray-700 mb-2">Bundle {trip.selectedBundle.label} selected</p>
              <p className="text-gray-600">{trip.selectedBundle.description}</p>
              <p className="text-gray-500 mt-2">
                Total: <span className="font-medium text-gray-800">${trip.selectedBundle.totalCostUsd}</span>
                {" "}· Budget cap: <span className="font-medium">${trip.budgetCapUsd}</span>
              </p>
            </div>
          )}

          {/* Send state */}
          {sendState === "sending" && (
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Sending approval email…
            </div>
          )}

          {sendState === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <p className="font-medium">Failed to send email</p>
              <p className="mt-1">{sendError}</p>
              {!session && (
                <p className="mt-2 text-xs">Make sure you are <a href="/login" className="underline">signed in with Google</a>.</p>
              )}
              <button
                onClick={() => { setSendState("idle"); setSendError(null) }}
                className="mt-3 text-blue-600 hover:underline text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {sendState === "sent" && (
            <div className="text-xs text-gray-500">
              Email sent to {sentTo}
            </div>
          )}

          {/* Approval polling status */}
          {(sendState === "sent") && !rejectionReason && (
            <ApprovalStatus
              tripId={tripId}
              onApproved={() => router.push(`/trip/${tripId}/checklist`)}
              onRejected={(reason) => setRejectionReason(reason ?? "Manager rejected the request.")}
            />
          )}

          {/* Rejection recovery */}
          {rejectionReason && (
            <RejectionRecovery
              tripId={tripId}
              rejectionReason={rejectionReason}
              policyCapUsd={parseFloat(trip.budgetCapUsd) || 200}
              onResubmitted={() => setRejectionReason(null)}
            />
          )}

          {/* Demo controls — only visible when NEXT_PUBLIC_ENABLE_DEMO_CONTROLS=true */}
          {process.env.NEXT_PUBLIC_ENABLE_DEMO_CONTROLS === "true" && (
            <div className="border border-dashed border-gray-300 rounded-xl p-4 text-sm">
              <p className="text-gray-500 font-medium mb-3">Demo controls — simulate manager reply</p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await fetch("/api/webhooks/gmail-approval", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tripId, approved: true, managerReply: "Approved. Safe travels!" }),
                    })
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg text-xs"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={async () => {
                    await fetch("/api/webhooks/gmail-approval", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tripId, approved: false, managerReply: "Please find a cheaper hotel option." }),
                    })
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded-lg text-xs"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mascot */}
        <div className="flex justify-center md:justify-start">
          <Mascot bubblePosition="below" />
        </div>
      </div>
    </main>
  )
}
