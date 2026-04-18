// ============================================================
// API ROUTE: Trip Hotel Search
// OWNER: Track C (Data & Integrations)
// ROUTE: POST /api/trips/[id]/hotels
// DESCRIPTION: Searches for hotels near the destination office
//   using $geoNear. Cross-references results with preferred
//   vendors and compares against policy nightly cap.
//
// RESPONSE (200):
// {
//   "hotels": [
//     { "id": "hotel_marriott_milan", "name": "Marriott Milan",
//       "nightlyRateUsd": 185, "preferred": true,
//       "distanceFromOfficeKm": 0.8, "overPolicyCap": false },
//     { "id": "hotel_nh_collection", "name": "NH Collection Milano",
//       "nightlyRateUsd": 159, "preferred": false,
//       "distanceFromOfficeKm": 2.1, "overPolicyCap": false }
//   ],
//   "policyCapUsd": 200
// }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb/client"
import Trip from "@/lib/mongodb/models/Trip"
import { searchHotels } from "@/lib/hotels/search"
import budgetCaps from "../../../../../../data/policy/budget-caps.json"

type HotelsRouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, context: HotelsRouteContext) {
  try {
    const { id } = await context.params
    await connectToDatabase()

    const trip = await Trip.findById(id)
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const { city, country } = trip.destination
    const policy = budgetCaps.cities.find(
      (c) => c.country === country && c.city.toLowerCase() === city.toLowerCase()
    )

    if (!policy) {
      return NextResponse.json(
        { error: `No policy found for ${city} (${country})` },
        { status: 404 }
      )
    }

    const checkIn  = new Date(trip.dates.departure).toISOString().split("T")[0]
    const checkOut = new Date(trip.dates.return).toISOString().split("T")[0]

    const hotels = await searchHotels({
      city,
      country,
      checkIn,
      checkOut,
      officeLat: policy.officeLat,
      officeLng: policy.officeLng,
      hotelNightlyCapUsd: policy.hotelNightlyCapUsd,
    })

    // Persist hotels onto the trip document
    await Trip.findByIdAndUpdate(id, { hotels })

    return NextResponse.json({
      hotels,
      policyCapUsd: policy.hotelNightlyCapUsd,
      officeLat: policy.officeLat,
      officeLng: policy.officeLng,
    })
  } catch (err) {
    console.error("[trips/hotels]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Hotel search failed" },
      { status: 500 }
    )
  }
}
