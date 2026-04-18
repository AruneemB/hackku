// ============================================================
// API ROUTE: List saved receipts (debug/viewer)
// ROUTE: GET /api/receipt/list
// DESCRIPTION: Returns all documents from the standalone
//   `receipts` collection for the /receipt/saved viewer page.
// ============================================================

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb/client"

export async function GET() {
  const client = await clientPromise
  const docs = await client
    .db("hackku")
    .collection("receipts")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(
    docs.map((d) => ({
      id: d._id.toString(),
      tripId: d.tripId,
      merchant: d.merchant,
      category: d.category,
      total: d.total?.toString() ?? "0.00",
      currency: d.currency,
      originalAmount: d.originalAmount?.toString() ?? "0.00",
      date: d.date,
      sanitized: d.sanitized,
      extractedByAI: d.extractedByAI,
      createdAt: d.createdAt,
    }))
  )
}
