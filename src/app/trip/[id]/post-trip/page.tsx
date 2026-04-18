// ============================================================
// PAGE: Post-Trip Closure
// OWNER: Track A (Frontend & UX)
// ROUTE: /trip/[id]/post-trip
// DESCRIPTION: Frames 13-15. Shown after Kelli returns.
//
// FRAME 13: ReceiptScanner for any missed paper receipts
// FRAME 14: Emergency safety net display (if applicable)
// FRAME 15: TripSummary — total spend vs budget, expense report
// FRAME 16: Privacy summary (data handling transparency)
//
//   On mount: scans Gmail for digital receipts missed during travel.
//   Generates expense report draft via Gemini.
// ============================================================

// TODO: "use client"
// TODO: import { ReceiptScanner } from "@/components/receipts/ReceiptScanner"
// TODO: import { TripSummary } from "@/components/trip/TripSummary"
// TODO: import { useTrip } from "@/hooks/useTrip"
// TODO: import { useState } from "react"

// TODO: export default function PostTripPage({ params }: { params: { id: string } }) {
//   // const { trip } = useTrip(params.id)
//   // Scan Gmail for receipts on mount → POST /api/trips/[id]/receipts for each
//   // Generate expense report draft via Gemini
//   // Render: ReceiptScanner → TripSummary → Archive button
//   // Privacy summary section at bottom (Frame 16)
// }

export default function PostTripPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">Post Trip — scaffold in progress</p>
    </main>
  );
}

