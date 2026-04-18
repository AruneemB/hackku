// ============================================================
// API ROUTE: Receipt Capture (Frame 13)
// OWNER: Track B (AI & Intelligence)
// ROUTE: POST /api/trips/[id]/receipts
// DESCRIPTION: Receives a base64 image from ReceiptScanner,
//   runs Gemini multimodal extraction, sanitizes PII, converts
//   amount to Decimal128, and appends to trip.receipts[].
//
// REQUEST BODY:
// {
//   "imageBase64": "<base64 string>",
//   "mimeType": "image/jpeg"
// }
//
// RESPONSE (201):
// {
//   "receipt": {
//     "merchant": "Ristorante Da Enzo",
//     "category": "meal",
//     "totalUsd": "47.23",
//     ...
//   }
// }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/client"
import Trip from "@/lib/mongodb/models/Trip"
import { extractReceiptData } from "@/lib/gemini/multimodal"
import { sanitizeReceiptData } from "@/lib/utils/pii"
import { toDecimal128, convertCurrency } from "@/lib/utils/currency"
import { Types } from "mongoose"

type ReceiptsRouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: ReceiptsRouteContext) {
  try {
    const { id } = await context.params
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) return NextResponse.json({ error: "imageBase64 required" }, { status: 400 })

    await connectToDatabase()
    const trip = await Trip.findById(id)
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    // Strip data URL prefix if the client sends a full data URL
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "")

    const raw = await extractReceiptData(base64Data, mimeType ?? "image/jpeg")
    const clean = sanitizeReceiptData(raw)

    const amountNum = parseFloat(clean.amount)
    if (!Number.isFinite(amountNum) || amountNum < 0) {
      return NextResponse.json({ error: "Invalid amount extracted from receipt" }, { status: 422 })
    }
    const totalUsd = await convertCurrency(amountNum, clean.currency, "USD")
    const totalDecimal = toDecimal128(totalUsd)
    const originalDecimal = toDecimal128(amountNum)

    const extractedDate = clean.date ? new Date(clean.date) : new Date()
    const receiptDate = isNaN(extractedDate.getTime()) ? new Date() : extractedDate

    const receipt = {
      _id: new Types.ObjectId(),
      merchant: clean.merchant,
      category: clean.category,
      total: totalDecimal,
      currency: clean.currency,
      originalAmount: originalDecimal,
      date: receiptDate,
      sanitized: true,
      extractedByAI: true,
      imageUrl: null,
    }

    // Atomic push + increment — no read-modify-write
    await Trip.findByIdAndUpdate(id, {
      $push: { receipts: receipt },
      $inc: { totalSpendUsd: totalUsd },
    })

    return NextResponse.json({
      receipt: {
        id: receipt._id.toString(),
        merchant: clean.merchant,
        category: clean.category,
        totalUsd: totalUsd.toFixed(2),
        currency: clean.currency,
        originalAmount: amountNum.toFixed(2),
        date: receipt.date,
        sanitized: true,
        extractedByAI: true,
        confidence: clean.confidence,
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[receipts]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Receipt processing failed" },
      { status: 500 }
    )
  }
}
