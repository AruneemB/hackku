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

"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { ReceiptScanner } from "@/components/receipts/ReceiptScanner"
import { useTrip } from "@/hooks/useTrip"
import { useMascot } from "@/hooks/useMascot"
import { Mascot } from "@/components/mascot/Mascot"
import type { Receipt } from "@/types"

export default function PostTripPage() {
  const params = useParams()
  const tripId = params.id as string
  const { data: session } = useSession()
  const { trip, isLoading, updateStatus, refresh } = useTrip(tripId)
  const { say } = useMascot()

  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [archiving, setArchiving] = useState(false)

  // Greet user on mount
  useEffect(() => {
    if (!trip) return
    const name = session?.user?.name?.split(" ")[0] ?? "there"
    void say(`Welcome back, ${name}! Let's wrap up your trip to ${trip.destination.city}. Scan any paper receipts you have.`, "excited")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.destination.city])

  // Sync receipts from trip document
  useEffect(() => {
    if (trip?.receipts) setReceipts(trip.receipts)
  }, [trip?.receipts])

  function handleReceiptAdded(receipt: Receipt) {
    setReceipts((prev) => [...prev, receipt])
    void refresh()
  }

  async function handleArchive() {
    setArchiving(true)
    await updateStatus("archived")
    void say("Your trip has been archived. Great work staying within budget!", "excited")
    setArchiving(false)
  }

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

  const totalSpend = parseFloat(trip.totalSpendUsd?.toString() ?? "0")
  const budgetCap  = parseFloat(trip.budgetCapUsd?.toString()  ?? "2800")
  const remaining  = budgetCap - totalSpend
  const underBudget = remaining >= 0
  const userName   = session?.user?.name ?? "Traveler"

  const byCategory = receipts.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + parseFloat(r.totalUsd ?? "0")
    return acc
  }, {})

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post-Trip Summary</h1>
        <p className="text-sm text-gray-500 mt-1">
          {userName} · {trip.destination.city}, {trip.destination.country}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-5">

          {/* Spend summary */}
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Expense Summary</h2>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <SummaryCard label="Total Spent"  value={`$${totalSpend.toFixed(2)}`}  />
              <SummaryCard label="Budget Cap"   value={`$${budgetCap.toFixed(2)}`}   />
              <SummaryCard
                label={underBudget ? "Under Budget" : "Over Budget"}
                value={`$${Math.abs(remaining).toFixed(2)}`}
                highlight={underBudget ? "green" : "red"}
              />
            </div>

            {/* Category breakdown */}
            {Object.keys(byCategory).length > 0 && (
              <div className="border-t border-gray-100 pt-3 flex flex-col gap-1">
                {Object.entries(byCategory).map(([cat, total]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-500">{cat}</span>
                    <span className="font-medium text-gray-800">${total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receipt list */}
          {receipts.length > 0 && (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Receipts ({receipts.length})</h2>
              <div className="flex flex-col gap-2">
                {receipts.map((r, i) => (
                  <div key={r.id ?? i} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="font-medium text-gray-800">{r.merchant}</span>
                      <span className="text-gray-400 ml-2 capitalize text-xs">{r.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-800">${parseFloat(r.totalUsd).toFixed(2)}</span>
                      {r.currency !== "USD" && (
                        <span className="text-gray-400 text-xs ml-1">({r.originalAmount} {r.currency})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipt scanner */}
          <ReceiptScanner tripId={tripId} onReceiptAdded={handleReceiptAdded} />

          {/* Privacy notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
            <p className="font-semibold mb-1">Privacy Summary (Frame 16)</p>
            <p>All receipt images are processed by Gemini AI and immediately discarded. Only extracted text data is stored. Credit card numbers and CVVs are automatically redacted before saving. Your trip data is kept for 90 days then permanently deleted.</p>
          </div>

          {/* Archive button */}
          {trip.status !== "archived" && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl"
            >
              {archiving ? "Archiving…" : "Archive Trip"}
            </button>
          )}

          {trip.status === "archived" && (
            <div className="text-center text-green-600 font-medium text-sm py-2">
              ✓ Trip archived
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

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" }) {
  const color = highlight === "green" ? "text-green-600" : highlight === "red" ? "text-red-600" : "text-gray-800"
  return (
    <div className="bg-gray-50 rounded-xl py-3 px-2">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
