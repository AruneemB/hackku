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

    const raw = await extractReceiptData(imageBase64, mimeType ?? "image/jpeg")
    const clean = sanitizeReceiptData(raw)

    const amountNum = parseFloat(clean.amount)
    const totalUsd = await convertCurrency(amountNum, clean.currency, "USD")
    const totalDecimal = toDecimal128(totalUsd)
    const originalDecimal = toDecimal128(amountNum)

    const receipt = {
      _id: new Types.ObjectId(),
      merchant: clean.merchant,
      category: clean.category,
      total: totalDecimal,
      currency: clean.currency,
      originalAmount: originalDecimal,
      date: new Date(),
      sanitized: true,
      extractedByAI: true,
      imageUrl: null,
    }

    // Append receipt and update totalSpendUsd
    const currentTotal = parseFloat(trip.totalSpendUsd?.toString() ?? "0")
    const newTotal = toDecimal128(currentTotal + totalUsd)

    await Trip.findByIdAndUpdate(id, {
      $push: { receipts: receipt },
      $set: { totalSpendUsd: newTotal },
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
