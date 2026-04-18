// ============================================================
// API ROUTE: Hotel Geo Search
// ROUTE: POST /api/hotels/search
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Accepts a city + dates, resolves the office
//   coordinates and hotel cap from budget-caps.json, runs
//   $geoNear via searchHotels(), and returns Hotel[].
//   Used by the standalone /hotels test page (Step 10 sketch).
//
// REQUEST BODY:
//   { "city": "Milan", "country": "IT",
//     "checkIn": "2025-09-14", "checkOut": "2025-09-19" }
//
// RESPONSE (200): Hotel[]
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { searchHotels } from "@/lib/hotels/search"
import budgetCaps from "../../../../../data/policy/budget-caps.json"

export async function POST(req: NextRequest) {
  try {
    const { city, country, checkIn, checkOut } = await req.json()

    if (!city || !country || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: "city, country, checkIn, and checkOut are required" },
        { status: 400 }
      )
    }

    const policy = budgetCaps.cities.find(
      (c) => c.country === country && c.city.toLowerCase() === city.toLowerCase()
    )

    if (!policy) {
      return NextResponse.json(
        { error: `No policy found for ${city} (${country})` },
        { status: 404 }
      )
    }

    const hotels = await searchHotels({
      city,
      country,
      checkIn,
      checkOut,
      officeLat: policy.officeLat,
      officeLng: policy.officeLng,
      hotelNightlyCapUsd: policy.hotelNightlyCapUsd,
    })

    return NextResponse.json({
      hotels,
      meta: {
        city,
        country,
        officeLat: policy.officeLat,
        officeLng: policy.officeLng,
        hotelNightlyCapUsd: policy.hotelNightlyCapUsd,
        nights: Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
        ),
      },
    })
  } catch (err) {
    console.error("[hotels/search]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    )
  }
}
