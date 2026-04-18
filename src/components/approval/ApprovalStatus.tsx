// ============================================================
// COMPONENT: ApprovalStatus
// OWNER: Track A (Frontend & UX)
// FRAME: 6-7 — The Invisible Approval Handshake + Recovery
// DESCRIPTION: Shows the current approval state of the trip.
//   Polls /api/trips/[id] every 15 seconds to check if the
//   Atlas Trigger has updated the status.
//
// STATUS → DISPLAY:
//   pending_approval → "⏳ Waiting for manager approval... email sent"
//   approved         → "✅ Approved! Let's get you ready to travel."
//   rejected         → "❌ Rejected — see reason below"
//
// PROPS:
//   tripId: string
//   onApproved: () => void
//   onRejected: (reason: string) => void
// ============================================================

"use client"

import { useEffect, useRef } from "react"
import { useTrip } from "@/hooks/useTrip"
import { useMascot } from "@/hooks/useMascot"

interface ApprovalStatusProps {
  tripId: string
  onApproved: () => void
  onRejected: (reason: string) => void
}

export function ApprovalStatus({ tripId, onApproved, onRejected }: ApprovalStatusProps) {
  const { trip, refresh } = useTrip(tripId)
  const { say } = useMascot()
  const prevStatus = useRef<string | null>(null)

  // Poll every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => void refresh(), 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  // React to status changes
  useEffect(() => {
    if (!trip || trip.status === prevStatus.current) return
    prevStatus.current = trip.status

    if (trip.status === "approved") {
      void say("Great news! Your trip has been approved. Let's get you packed and ready!", "excited")
      onApproved()
    } else if (trip.status === "rejected") {
      const reason = trip.approvalThread?.reason ?? "No reason provided."
      void say(`Your trip request was declined. ${reason} Let's look at alternative options.`, "empathetic")
      onRejected(reason)
    }
  }, [trip, say, onApproved, onRejected])

  if (!trip) return null

  const status = trip.status

  return (
    <div className="flex flex-col gap-4">
      {status === "pending_approval" && (
        <div className="flex items-start gap-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="text-3xl">⏳</div>
          <div>
            <p className="font-semibold text-yellow-800">Waiting for manager approval</p>
            <p className="text-sm text-yellow-700 mt-1">
              Approval email sent. Checking for a reply every 15 seconds…
            </p>
            {trip.approvalThread?.gmailThreadId && (
              <p className="text-xs text-yellow-600 mt-2 font-mono">
                Thread ID: {trip.approvalThread.gmailThreadId}
              </p>
            )}
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="flex items-start gap-4 bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="text-3xl">✅</div>
          <div>
            <p className="font-semibold text-green-800">Trip approved!</p>
            <p className="text-sm text-green-700 mt-1">Your manager approved the trip. Let's get you ready to travel.</p>
          </div>
        </div>
      )}

      {status === "rejected" && (
        <div className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="text-3xl">❌</div>
          <div>
            <p className="font-semibold text-red-800">Trip request declined</p>
            {trip.approvalThread?.reason && (
              <p className="text-sm text-red-700 mt-1">Reason: {trip.approvalThread.reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
