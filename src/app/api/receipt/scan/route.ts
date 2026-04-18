// ============================================================
// API ROUTE: Receipt Scan — Gemini extraction only, no DB write
// ROUTE: POST /api/receipt/scan
// DESCRIPTION: Standalone receipt scanner endpoint (Step 14 sketch).
//   Receives a base64 image, runs Gemini multimodal extraction,
//   sanitizes PII, converts to USD, and returns the result for
//   user review before the confirm step writes to MongoDB.
//
// REQUEST BODY:
//   { "imageBase64": "data:image/jpeg;base64,...", "mimeType": "image/jpeg" }
//
// RESPONSE (200):
//   { "merchant", "amount", "currency", "date", "hasPII",
//     "confidence", "totalUsd" }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { extractReceiptData } from "@/lib/gemini/multimodal"
import { sanitizeReceiptData } from "@/lib/utils/pii"
import { convertCurrency } from "@/lib/utils/currency"

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "imageBase64 and mimeType are required" },
        { status: 400 }
      )
    }

    // Strip data URL prefix if the client sends a full data URL
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "")

    const raw = await extractReceiptData(base64Data, mimeType)
    const clean = sanitizeReceiptData(raw)

    let totalUsd = parseFloat(clean.amount)
    try {
      totalUsd = await convertCurrency(parseFloat(clean.amount), clean.currency, "USD")
    } catch {
      // Conversion failed — fall back to original amount and note it
    }

    return NextResponse.json({
      merchant: clean.merchant,
      amount: clean.amount,
      currency: clean.currency,
      date: clean.date,
      category: clean.category ?? "other",
      hasPII: clean.hasPII,
      confidence: raw.confidence,
      totalUsd: totalUsd.toFixed(2),
    })
  } catch (err) {
    console.error("[receipt/scan]", err)
    return NextResponse.json({ error: "Failed to scan receipt" }, { status: 500 })
  }
}
