"use client"

// ============================================================
// PAGE: Receipt Scanner (Standalone Sketch)
// ROUTE: /receipt
// OWNER: Track B (AI & Intelligence) + Track A (Frontend & UX)
// FRAME: 13 — Multimodal Receipt Harvesting
// DESCRIPTION: Standalone version for development/demo.
//   Will be embedded in /trip/[id]/post-trip when integrated.
//
// FLOW:
//   1. Live webcam stream (getUserMedia, rear camera preferred)
//      → fallback to <input capture="environment"> on failure
//   2. User captures or uploads a receipt photo
//   3. POST /api/receipt/scan → Gemini extracts data
//   4. User reviews extracted fields, picks category
//   5. POST /api/receipt/save → MongoDB write with placeholder tripId
//   6. Success confirmation
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react"

type Step = "capture" | "preview" | "scanning" | "review" | "saving" | "done"

interface ScannedReceipt {
  merchant: string
  amount: string
  currency: string
  date: string
  category: string
  confidence: number
  totalUsd: string
}

interface SavedReceipt extends ScannedReceipt {
  id: string
  category: string
}

export default function ReceiptScannerPage() {
  const [step, setStep] = useState<Step>("capture")
  const [webcamReady, setWebcamReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [scanned, setScanned] = useState<ScannedReceipt | null>(null)
  const [saved, setSaved] = useState<SavedReceipt | null>(null)
  const [category, setCategory] = useState("meal")
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopWebcam = useCallback(() => {
    console.info("[receipt] stopping webcam stream")
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startWebcam = useCallback(async () => {
    console.info("[receipt] requesting camera access")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setWebcamReady(true)
      console.info("[receipt] camera ready")
    } catch (err) {
      console.warn("[receipt] camera unavailable, falling back to file input", err)
      setWebcamReady(false)
    }
  }, [])

  useEffect(() => {
    console.info("[receipt] page mounted")
    const timer = window.setTimeout(() => {
      void startWebcam()
    }, 0)
    return () => {
      window.clearTimeout(timer)
      stopWebcam()
    }
  }, [startWebcam, stopWebcam])

  function captureFromWebcam() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    console.info("[receipt] capturing frame from webcam")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")!.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
    stopWebcam()
    setCapturedImage(dataUrl)
    setStep("preview")
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    console.info("[receipt] file selected", { name: file.name, type: file.type, size: file.size })
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string)
      stopWebcam()
      setStep("preview")
    }
    reader.readAsDataURL(file)
  }

  async function scanWithGemini() {
    if (!capturedImage) return
    console.info("[receipt] sending image to /api/receipt/scan")
    setError(null)
    setStep("scanning")
    try {
      const res = await fetch("/api/receipt/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: capturedImage, mimeType: "image/jpeg" }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Scan failed")
      const data: ScannedReceipt = await res.json()
      console.info("[receipt] scan complete", data)
      setScanned(data)
      setCategory(data.category ?? "other")
      setStep("review")
    } catch (err) {
      console.error("[receipt] scan failed", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setStep("preview")
    }
  }

  async function saveToMongo() {
    if (!scanned) return
    console.info("[receipt] saving parsed receipt", { merchant: scanned.merchant, category, totalUsd: scanned.totalUsd })
    setStep("saving")
    try {
      const res = await fetch("/api/receipt/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: scanned.merchant,
          category,
          totalUsd: scanned.totalUsd,
          currency: scanned.currency,
          originalAmount: scanned.amount,
          date: scanned.date,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
      const { id } = await res.json()
      console.info("[receipt] save complete", { id })
      setSaved({ ...scanned, id, category })
      setStep("done")
    } catch (err) {
      console.error("[receipt] save failed", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setStep("review")
    }
  }

  function reset() {
    console.info("[receipt] resetting scanner")
    setCapturedImage(null)
    setScanned(null)
    setSaved(null)
    setError(null)
    setCategory("meal")
    setStep("capture")
    startWebcam()
  }

  const confidenceColor =
    scanned && scanned.confidence >= 0.8
      ? "bg-green-900/60 text-green-300"
      : scanned && scanned.confidence >= 0.5
        ? "bg-yellow-900/60 text-yellow-300"
        : "bg-red-900/60 text-red-300"

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Receipt Scanner</h1>
          <p className="text-gray-400 text-xs mt-1">Gemini multimodal · Step 14 sketch</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-2">
          {(["capture", "preview", "review", "done"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                step === s
                  ? "bg-blue-500"
                  : ["scanning", "saving"].includes(step) && i === 1
                    ? "bg-blue-500"
                    : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* STEP: CAPTURE */}
        {step === "capture" && (
          <div className="flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
              {/* Always in DOM so srcObject can be assigned before webcamReady flips */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${webcamReady ? "" : "invisible"}`}
              />
              {!webcamReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <span className="text-4xl">📷</span>
                  <span className="text-sm">Camera unavailable</span>
                </div>
              )}
              {webcamReady && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white/40 border-dashed rounded-xl w-4/5 h-3/5" />
                  </div>
                  <p className="absolute bottom-3 left-0 right-0 text-center text-white/60 text-xs">
                    Align receipt within the guide
                  </p>
                </>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {webcamReady && (
              <button
                onClick={captureFromWebcam}
                className="bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
              >
                Capture
              </button>
            )}

            <label className="border border-gray-600 text-gray-300 font-medium py-3 rounded-xl text-center cursor-pointer hover:bg-gray-800 active:scale-95 transition-all">
              {webcamReady ? "Upload instead" : "Choose photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === "preview" && capturedImage && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl overflow-hidden border border-gray-700">
              <img
                src={capturedImage}
                alt="Captured receipt"
                className="w-full object-contain max-h-80"
              />
            </div>
            <button
              onClick={scanWithGemini}
              className="bg-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-500 active:scale-95 transition-all"
            >
              Scan with Gemini
            </button>
            <button
              onClick={reset}
              className="text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
            >
              Retake
            </button>
          </div>
        )}

        {/* STEP: SCANNING */}
        {step === "scanning" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Gemini is reading your receipt…</p>
          </div>
        )}

        {/* STEP: REVIEW */}
        {step === "review" && scanned && (
          <div className="flex flex-col gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Extracted by Gemini
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
                  {Math.round(scanned.confidence * 100)}% confidence
                </span>
              </div>

              <Field label="Merchant" value={scanned.merchant} />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Original" value={`${scanned.amount} ${scanned.currency}`} />
                <Field label="USD Total" value={`$${scanned.totalUsd}`} highlight />
              </div>

              <Field label="Date" value={scanned.date} />

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                  Category
                </p>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meal">Meal</option>
                  <option value="transport">Transport</option>
                  <option value="hotel">Hotel</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <p className="text-xs text-green-500/80">PII sanitized before storage</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-800">
              Will save with tripId:{" "}
              <code className="text-gray-400">PLACEHOLDER_TRIP_ID_000000000000</code>
            </div>

            <button
              onClick={saveToMongo}
              className="bg-green-700 font-semibold py-3 rounded-xl hover:bg-green-600 active:scale-95 transition-all"
            >
              Confirm & Save to MongoDB
            </button>
            <button
              onClick={reset}
              className="text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
            >
              Discard
            </button>
          </div>
        )}

        {/* STEP: SAVING */}
        {step === "saving" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Saving to MongoDB…</p>
          </div>
        )}

        {/* STEP: DONE */}
        {step === "done" && saved && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-lg font-semibold">{saved.merchant}</h2>
              <p className="text-green-400 font-medium text-xl mt-1">${saved.totalUsd}</p>
              <p className="text-gray-500 text-xs mt-1">
                {saved.currency} · {saved.category}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-xs text-gray-500 text-left w-full">
              <p>Saved to MongoDB <code className="text-gray-300">receipts</code> collection</p>
              <p className="mt-1">Document ID: <code className="text-gray-300">{saved.id}</code></p>
              <p className="mt-1">
                tripId: <code className="text-gray-400">PLACEHOLDER_TRIP_ID_000000000000</code>
              </p>
            </div>
            <button
              onClick={reset}
              className="bg-blue-600 font-semibold py-3 px-10 rounded-xl hover:bg-blue-500 active:scale-95 transition-all mt-2"
            >
              Scan Another
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className={`mt-0.5 font-medium ${highlight ? "text-green-400 text-lg" : "text-white text-sm"}`}>
        {value}
      </p>
    </div>
  )
}
