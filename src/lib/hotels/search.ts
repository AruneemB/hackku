// ============================================================
// LIB: Hotel Search API Wrapper
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Searches for hotels near the destination office.
//   Results are normalized into our Hotel type then passed to
//   geoSearch.ts for proximity filtering and preferred vendor
//   cross-referencing.
//
//   For the demo, use SerpAPI Google Hotels or a hardcoded list
//   from the preferred_vendors collection.
//
// USAGE:
//   const hotels = await searchHotels({ city: "Milan", country: "IT",
//     checkIn: "2025-09-14", checkOut: "2025-09-19" })
// ============================================================

import { findVendorsNearOffice } from "./geoSearch"
import type { Hotel } from "@/types"

export interface HotelSearchParams {
  city: string
  country: string
  checkIn: string       // YYYY-MM-DD
  checkOut: string      // YYYY-MM-DD
  officeLat: number
  officeLng: number
  hotelNightlyCapUsd: number
  radiusKm?: number
}

export async function searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
  const {
    country, checkIn, checkOut,
    officeLat, officeLng,
    hotelNightlyCapUsd,
    radiusKm = 25,
  } = params

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.max(
    1,
    Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000)
  )

  const vendors = await findVendorsNearOffice({
    lat: officeLat,
    lng: officeLng,
    radiusKm,
    country,
    type: "hotel",
  })

  return vendors.map((v) => {
    const distKm = Math.round((v.distMeters / 1000) * 100) / 100
    const over = v.nightlyRateUsd > hotelNightlyCapUsd

    return {
      id: v._id.toString(),
      name: v.name,
      location: v.location,
      address: v.address ?? "",
      distanceFromOfficeKm: distKm,
      nightlyRateUsd: v.nightlyRateUsd,
      amenities: v.amenities ?? { freeBreakfast: false, wifi: false, gym: false, parking: false },
      preferred: true,
      overPolicyCap: over,
      excessAboveCapUsd: over ? Math.round((v.nightlyRateUsd - hotelNightlyCapUsd) * 100) / 100 : 0,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalCostUsd: Math.round(v.nightlyRateUsd * nights * 100) / 100,
      source: "preferred_vendors_db",
    } satisfies Hotel
  })
}
