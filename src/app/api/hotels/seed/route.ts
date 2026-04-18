// ============================================================
// API ROUTE: Seed preferred_vendors collection
// ROUTE: POST /api/hotels/seed
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: One-time setup route for the /hotels test page.
//   Drops and re-seeds the preferred_vendors collection from
//   data/vendors/preferred-vendors.json, then creates the
//   2dsphere index required by $geoNear in geoSearch.ts.
//   Safe to call multiple times — drops before re-inserting.
// ============================================================

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb/client"
import vendorsData from "../../../../../data/vendors/preferred-vendors.json"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }
  try {
    const client = await clientPromise
    const db = client.db("hackku")
    const col = db.collection("preferred_vendors")

    await col.deleteMany({})
    const result = await col.insertMany(vendorsData.vendors)

    await col.createIndex({ location: "2dsphere" })

    return NextResponse.json({
      seeded: result.insertedCount,
      message: `${result.insertedCount} vendors seeded, 2dsphere index created`,
    })
  } catch (err) {
    console.error("[hotels/seed]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    )
  }
}
