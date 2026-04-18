"use client"

// ============================================================
// PAGE: Saved Receipts Viewer (debug)
// ROUTE: /receipt/saved
// DESCRIPTION: Lists all receipts in the standalone `receipts`
//   collection. Useful for verifying scanner output before
//   integration with the trip flow.
// ============================================================

import { useEffect, useState } from "react"
import Link from "next/link"

interface SavedReceipt {
  id: string
  tripId: string
  merchant: string
  category: string
  total: string
  currency: string
  originalAmount: string
  date: string
  sanitized: boolean
  extractedByAI: boolean
  createdAt: string
}

export default function SavedReceiptsPage() {
  const [receipts, setReceipts] = useState<SavedReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/receipt/list")
      .then((r) => r.json())
      .then((data) => { setReceipts(data); setLoading(false) })
      .catch((e) => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Saved Receipts</h1>
            <p className="text-gray-500 text-xs mt-0.5">MongoDB · receipts collection</p>
          </div>
          <Link
            href="/receipt"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Scan another
          </Link>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-gray-400 py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading from MongoDB…
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && receipts.length === 0 && (
          <p className="text-gray-500 py-8 text-center">No receipts saved yet.</p>
        )}

        {receipts.map((r) => (
          <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.merchant}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{r.category}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-green-400 font-semibold">${r.total}</p>
                <p className="text-xs text-gray-500">{r.originalAmount} {r.currency}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 border-t border-gray-800 pt-2 mt-1">
              <span>Date: <span className="text-gray-300">{new Date(r.date).toLocaleDateString()}</span></span>
              <span>Saved: <span className="text-gray-300">{new Date(r.createdAt).toLocaleString()}</span></span>
              <span>PII sanitized: <span className={r.sanitized ? "text-green-400" : "text-red-400"}>{r.sanitized ? "yes" : "no"}</span></span>
              <span>AI extracted: <span className="text-gray-300">{r.extractedByAI ? "yes" : "no"}</span></span>
            </div>

            <div className="text-xs text-gray-600 border-t border-gray-800 pt-2 mt-1 font-mono break-all">
              <span className="text-gray-500">_id: </span>{r.id}<br />
              <span className="text-gray-500">tripId: </span>{r.tripId}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
