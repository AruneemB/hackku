// ============================================================
// API ROUTE: Receipt Save — writes confirmed receipt to MongoDB
// ROUTE: POST /api/receipt/save
// DESCRIPTION: Called after the user reviews and confirms the
//   Gemini-extracted data. Writes to the standalone `receipts`
//   collection with a placeholder tripId.
//
//   PLACEHOLDER_TRIP_ID will be replaced with a real ObjectId
//   when this scanner is integrated into /trip/[id]/post-trip.
//
// REQUEST BODY:
//   { merchant, category, totalUsd, currency, originalAmount, date }
//
// RESPONSE (201):
//   { "id": "<insertedId>", "tripId": "PLACEHOLDER_TRIP_ID_000000000000" }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { toDecimal128 } from "@/lib/utils/currency"
import clientPromise from "@/lib/mongodb/client"

const PLACEHOLDER_TRIP_ID = "PLACEHOLDER_TRIP_ID_000000000000"

export async function POST(req: NextRequest) {
  try {
    const { tripId: bodyTripId, merchant, category, totalUsd, currency, originalAmount, date } =
      await req.json()

    if (typeof merchant !== "string" || !merchant.trim()) {
      return NextResponse.json({ error: "merchant is required" }, { status: 400 })
    }
    const parsedTotal = parseFloat(totalUsd)
    if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
      return NextResponse.json({ error: "totalUsd must be a non-negative number" }, { status: 400 })
    }
    const parsedDate = date ? new Date(date) : null
    if (parsedDate && isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "date is not a valid date string" }, { status: 400 })
    }
    const tripId = typeof bodyTripId === "string" && bodyTripId.trim() ? bodyTripId.trim() : PLACEHOLDER_TRIP_ID

    const now = new Date()
    const doc = {
      tripId,
      merchant: merchant.trim(),
      category: category ?? "other",
      total: toDecimal128(parsedTotal),
      currency: currency ?? "USD",
      originalAmount: toDecimal128(parseFloat(originalAmount ?? String(parsedTotal))),
      date: parsedDate ?? now,
      sanitized: true,
      extractedByAI: true,
      imageUrl: null,
      createdAt: now,
    }

    const client = await clientPromise
    const db = client.db("hackku")
    const result = await db.collection("receipts").insertOne(doc)

    return NextResponse.json(
      { id: result.insertedId.toString(), tripId },
      { status: 201 }
    )
  } catch (err) {
    console.error("[receipt/save]", err)
    return NextResponse.json({ error: "Failed to save receipt" }, { status: 500 })
  }
}
