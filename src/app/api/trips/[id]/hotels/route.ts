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

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { findVendorsNearOffice, markPreferredVendors } from "@/lib/hotels/geoSearch"
// TODO: import { searchHotels } from "@/lib/hotels/search"

// TODO: export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   // 1. Load trip + policy from DB
//   // 2. searchHotels(destination, checkIn, checkOut)
//   // 3. findVendorsNearOffice(officeLat, officeLng, radiusKm, country)
//   // 4. markPreferredVendors(hotelResults, country)
//   // 5. Save to trip.hotels, return results
// }
