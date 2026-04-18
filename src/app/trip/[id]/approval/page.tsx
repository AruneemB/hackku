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

// TODO: "use client"
// TODO: import { useEffect, useState } from "react"
// TODO: import { ApprovalStatus } from "@/components/approval/ApprovalStatus"
// TODO: import { RejectionRecovery } from "@/components/approval/RejectionRecovery"
// TODO: import { useTrip } from "@/hooks/useTrip"

// TODO: export default function ApprovalPage({ params }: { params: { id: string } }) {
//   // const { trip } = useTrip(params.id)
//   // Send approval email on mount (if not already sent)
//   // Render ApprovalStatus or RejectionRecovery based on trip.approvalThread.status
// }
