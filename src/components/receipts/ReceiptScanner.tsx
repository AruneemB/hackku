// ============================================================
// COMPONENT: ReceiptScanner
// OWNER: Track A (Frontend & UX) + Track B (Gemini vision)
// FRAME: 13 — Multimodal Receipt Harvesting
// DESCRIPTION: Camera interface that captures a receipt photo
//   and sends it to /api/trips/[id]/receipts for Gemini
//   multimodal extraction. Shows extracted data for confirmation
//   before saving to the trip document.
//
// FLOW:
//   1. Open camera (<input type="file" accept="image/*" capture="environment">)
//   2. User photographs receipt
//   3. Convert to base64, POST to /api/trips/[id]/receipts
//   4. Show extracted data (merchant, amount, date) for review
//   5. Confirmed → appended to trip and onReceiptAdded fires
//
// PROPS:
//   tripId: string
//   onReceiptAdded: (receipt: Receipt) => void
// ============================================================

"use client"

import { useState, useRef } from "react"
import { useMascot } from "@/hooks/useMascot"
import type { Receipt } from "@/types"

interface ReceiptScannerProps {
  tripId: string
  onReceiptAdded: (receipt: Receipt) => void
}

type ScanState = "idle" | "preview" | "scanning" | "review" | "done"

interface ScannedReceipt {
  id: string
  merchant: string
  category: string
  totalUsd: string
  currency: string
  originalAmount: string
  date: string
  confidence: number
}

export function ReceiptScanner({ tripId, onReceiptAdded }: ReceiptScannerProps) {
  const { say, setThinking } = useMascot()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState("image/jpeg")
  const [scanned, setScanned] = useState<ScannedReceipt | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setMimeType(file.type || "image/jpeg")
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1] ?? ""
      setImageBase64(base64)
      setScanState("preview")
    }
    reader.readAsDataURL(file)
  }

  async function handleScan() {
    if (!imageBase64) return
    setScanState("scanning")
    setError(null)
    setThinking(true)

    try {
      const res = await fetch(`/api/trips/${tripId}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Scan failed")

      setScanned(data.receipt)
      setScanState("review")
      void say(
        `I found a ${data.receipt.category} receipt from ${data.receipt.merchant} for $${data.receipt.totalUsd}.`,
        "excited"
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed")
      setScanState("preview")
      void say("I had trouble reading that receipt. Try a clearer photo.", "empathetic")
    } finally {
      setThinking(false)
    }
  }

  function handleConfirm() {
    if (!scanned) return
    onReceiptAdded({
      id: scanned.id,
      tripId,
      merchant: scanned.merchant,
      category: scanned.category as Receipt["category"],
      totalUsd: scanned.totalUsd,
      currency: scanned.currency,
      originalAmount: scanned.originalAmount,
      date: new Date(scanned.date),
      sanitized: true,
      imageUrl: null,
      extractedByAI: true,
      createdAt: new Date(),
    })
    setScanState("done")
    void say("Receipt saved! Scan another one if you have more.", "neutral")
  }

  function handleReset() {
    setScanState("idle")
    setPreviewUrl(null)
    setImageBase64(null)
    setScanned(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Receipt Scanner</p>

      {/* Idle */}
      {scanState === "idle" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-400">Photograph a paper receipt to extract and save it to your trip.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold py-3 rounded-xl text-sm"
          >
            📷 Capture Receipt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Preview */}
      {scanState === "preview" && previewUrl && (
        <div className="flex flex-col gap-3">
          <img src={previewUrl} alt="Receipt preview" className="w-full max-h-64 object-contain rounded-xl" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleScan}
              className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold py-2 rounded-xl text-sm"
            >
              Scan with AI
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all text-white font-semibold py-2 rounded-xl text-sm"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {/* Scanning */}
      {scanState === "scanning" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Kelli is reading your receipt…</p>
        </div>
      )}

      {/* Review */}
      {scanState === "review" && scanned && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-800 rounded-xl p-3 flex flex-col gap-2 text-sm">
            <Row label="Merchant"  value={scanned.merchant} />
            <Row label="Category"  value={scanned.category} />
            <Row label="Amount"    value={`${scanned.originalAmount} ${scanned.currency} → $${scanned.totalUsd} USD`} />
            <Row label="Date"      value={scanned.date} />
            <Row label="Confidence" value={`${Math.round(scanned.confidence * 100)}%`} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white font-semibold py-2 rounded-xl text-sm"
            >
              ✓ Save Receipt
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all text-white font-semibold py-2 rounded-xl text-sm"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {scanState === "done" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <span>✓</span> Receipt saved to your trip
          </div>
          <button
            onClick={handleReset}
            className="bg-gray-700 hover:bg-gray-600 active:scale-95 transition-all text-white font-semibold py-2 rounded-xl text-sm"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-white text-right truncate">{value}</span>
    </div>
  )
}
