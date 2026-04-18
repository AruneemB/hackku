// ============================================================
// LIB: Gemini Multimodal (Receipt Vision)
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Handles Frame 13 — Kelli holds a paper receipt
//   to the camera and Gemini extracts the data. The image is
//   passed as a base64 inline part. PII sanitization runs
//   BEFORE saving to MongoDB (see lib/utils/pii.ts).
//
// USAGE (called from /api/trips/[id]/receipts):
//   const extraction = await extractReceiptData(base64Image, mimeType)
//   const clean = sanitizePII(extraction)
//   → save to trip.receipts[]
// ============================================================

import { geminiModel } from "./client"
import type { GeminiReceiptExtraction } from "@/types"

const RECEIPT_PROMPT = `You are a receipt OCR scanner. Extract from this receipt image:
- merchant: the business name
- amount: the total charged (number only, no symbol)
- currency: ISO 4217 code (e.g. USD, EUR, JPY) — infer from locale/symbol if not explicit
- date: the transaction date as shown
- category: one of "meal", "transport", "hotel", or "other" — infer from the merchant name/type
- hasPII: true if credit card numbers, SSNs, or CVVs are visible
- confidence: 0.0–1.0

Return ONLY a JSON object, no markdown, no explanation. Example:
{"merchant":"Ristorante Da Enzo","amount":"43.50","currency":"EUR","date":"15/09/2025","category":"meal","hasPII":false,"confidence":0.97}`

export async function extractReceiptData(
  base64Image: string,
  mimeType: string,
  attempt = 0
): Promise<GeminiReceiptExtraction> {
  try {
    const imagePart = { inlineData: { data: base64Image, mimeType } }
    const result = await geminiModel.generateContent([RECEIPT_PROMPT, imagePart])
    const text = result.response.text().trim()
    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
    const parsed = JSON.parse(jsonText) as Record<string, unknown>

    const ALLOWED_CATEGORIES = new Set(["meal", "transport", "hotel", "other"])
    const merchant = typeof parsed.merchant === "string" && parsed.merchant.trim() ? parsed.merchant.trim() : "Unknown"
    const amount = String(parsed.amount ?? "0")
    const amountNum = parseFloat(amount)
    const currency = typeof parsed.currency === "string" && /^[A-Z]{3}$/.test(parsed.currency) ? parsed.currency : "USD"
    const category = typeof parsed.category === "string" && ALLOWED_CATEGORIES.has(parsed.category) ? parsed.category : "other"
    const hasPII = typeof parsed.hasPII === "boolean" ? parsed.hasPII : false
    const rawConf = typeof parsed.confidence === "number" ? parsed.confidence : 0
    const confidence = Math.max(0, Math.min(1, rawConf))

    return {
      merchant,
      amount: Number.isFinite(amountNum) && amountNum >= 0 ? String(amountNum) : "0",
      currency,
      date: typeof parsed.date === "string" ? parsed.date : new Date().toISOString().split("T")[0],
      category,
      hasPII,
      confidence,
    } as GeminiReceiptExtraction
  } catch (err: unknown) {
    const apiErr = err as { status?: number; errorDetails?: { "@type": string; retryDelay?: string }[] }
    if (apiErr?.status === 429 && attempt < 2) {
      const retryInfo = apiErr.errorDetails?.find(
        (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
      )
      const delaySecs = parseInt(retryInfo?.retryDelay ?? "99", 10) || 99
      // Only retry for short per-minute limits; bail immediately on daily quota exhaustion
      if (delaySecs > 10) throw new Error("Gemini quota exhausted — try again later or upgrade your API key.")
      await new Promise((resolve) => setTimeout(resolve, (delaySecs + 1) * 1000))
      return extractReceiptData(base64Image, mimeType, attempt + 1)
    }
    throw err
  }
}
