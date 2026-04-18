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

// TODO: "use client"
// TODO: import { useTrip } from "@/hooks/useTrip"
// TODO: import { useMascot } from "@/hooks/useMascot"
// TODO: import { useEffect } from "react"

// TODO: export function ApprovalStatus({ tripId, onApproved, onRejected }) {
//   // const { trip } = useTrip(tripId) — polls automatically
//   // useEffect: when status changes to "approved" → say("approved!", "excited")
//   // useEffect: when status changes to "rejected" → say(reason, "empathetic")
//   // Render status badge + timestamp
// }
