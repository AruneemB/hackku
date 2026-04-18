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
    const { merchant, category, totalUsd, currency, originalAmount, date } =
      await req.json()

    if (!merchant || !totalUsd) {
      return NextResponse.json(
        { error: "merchant and totalUsd are required" },
        { status: 400 }
      )
    }

    const now = new Date()
    const doc = {
      tripId: PLACEHOLDER_TRIP_ID,
      merchant,
      category: category ?? "other",
      total: toDecimal128(totalUsd),
      currency: currency ?? "USD",
      originalAmount: toDecimal128(originalAmount ?? totalUsd),
      date: date ? new Date(date) : now,
      sanitized: true,
      extractedByAI: true,
      imageUrl: null,
      createdAt: now,
    }

    const client = await clientPromise
    const db = client.db("hackku")
    const result = await db.collection("receipts").insertOne(doc)

    return NextResponse.json(
      { id: result.insertedId.toString(), tripId: PLACEHOLDER_TRIP_ID },
      { status: 201 }
    )
  } catch (err) {
    console.error("[receipt/save]", err)
    return NextResponse.json({ error: "Failed to save receipt" }, { status: 500 })
  }
}
