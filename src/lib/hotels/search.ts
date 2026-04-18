// ============================================================
// LIB: Hotel Search API Wrapper
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Searches for hotels near the destination office.
//   Uses SerpAPI Google Hotels for live results, then merges
//   with preferred vendors from MongoDB. Preferred vendors are
//   prioritised and de-duplicated.
//
// USAGE:
//   const hotels = await searchHotels({ city: "Milan", country: "IT",
//     checkIn: "2025-09-14", checkOut: "2025-09-19" })
// ============================================================

import { getJson } from "serpapi"
import { findVendorsNearOffice } from "./geoSearch"
import type { Hotel, HotelAmenity } from "@/types"

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

// ---- SerpAPI response shapes --------------------------------

interface SerpGpsCoordinates {
  latitude: number
  longitude: number
}

interface SerpRatePerNight {
  lowest?: string
  extracted_lowest?: number
}

interface SerpProperty {
  name: string
  gps_coordinates?: SerpGpsCoordinates
  rate_per_night?: SerpRatePerNight
  total_rate?: { extracted_lowest?: number }
  amenities?: string[]
  overall_rating?: number
  reviews?: number
  type?: string
  property_token?: string
}

// ---- Helpers ------------------------------------------------

/** Haversine formula – returns distance in km between two lat/lng pairs. */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Map SerpAPI amenity string list to our structured HotelAmenity. */
function mapSerpAmenities(amenities?: string[]): HotelAmenity {
  if (!amenities) return { freeBreakfast: false, wifi: false, gym: false, parking: false }
  const lower = amenities.map((a) => a.toLowerCase())
  return {
    freeBreakfast: lower.some((a) => a.includes("breakfast")),
    wifi: lower.some((a) => a.includes("wi-fi") || a.includes("wifi")),
    gym: lower.some((a) => a.includes("gym") || a.includes("fitness")),
    parking: lower.some((a) => a.includes("parking")),
  }
}

// ---- Main search function -----------------------------------

export async function searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
  const {
    city, country, checkIn, checkOut,
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

  // SerpAPI rejects past check-in dates. If the dates are in the
  // past (e.g. demo defaults), shift them to tomorrow so the live
  // search still works. Preferred vendors don't care about dates.
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  let serpCheckIn = checkIn
  let serpCheckOut = checkOut
  if (checkInDate < tomorrow) {
    const shifted = new Date(tomorrow)
    const shiftedOut = new Date(shifted.getTime() + nights * 86_400_000)
    serpCheckIn = shifted.toISOString().split("T")[0]
    serpCheckOut = shiftedOut.toISOString().split("T")[0]
  }

  // ── 1. Preferred vendors from MongoDB ──────────────────────
  let preferredHotels: Hotel[] = []
  try {
    const vendors = await findVendorsNearOffice({
      lat: officeLat, lng: officeLng, radiusKm, country, type: "hotel",
    })

    preferredHotels = vendors.map((v) => {
      const distKm = Math.round((v.distMeters / 1000) * 100) / 100
      const rate = v.nightlyRateUsd
      const over = rate > hotelNightlyCapUsd
      return {
        id: v._id.toString(),
        name: v.name,
        location: v.location,
        address: v.address ?? "",
        distanceFromOfficeKm: distKm,
        nightlyRateUsd: rate,
        amenities: v.amenities ?? { freeBreakfast: false, wifi: false, gym: false, parking: false },
        preferred: true,
        overPolicyCap: over,
        excessAboveCapUsd: over ? Math.round((rate - hotelNightlyCapUsd) * 100) / 100 : 0,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalCostUsd: Math.round(rate * nights * 100) / 100,
        source: "preferred_vendors_db" as const,
      } satisfies Hotel
    })
  } catch (err) {
    console.warn("[hotels/search] preferred vendor lookup failed:", err)
  }

  // ── 2. Live hotels from SerpAPI Google Hotels ──────────────
  let serpHotels: Hotel[] = []
  const apiKey = process.env.SERPAPI_KEY
  console.log("[hotels/search] SERPAPI_KEY present:", !!apiKey, "| city:", city)
  if (apiKey) {
    try {
      const serpQuery = {
        engine: "google_hotels",
        q: `${city} hotels`,
        check_in_date: serpCheckIn,
        check_out_date: serpCheckOut,
        adults: 1,
        currency: "USD",
        hl: "en",
        api_key: apiKey,
      } as Record<string, string | number | undefined>
      console.log("[hotels/search] SerpAPI query:", { ...serpQuery, api_key: "***" })

      const results = await getJson(serpQuery)
      console.log("[hotels/search] SerpAPI returned properties:", Array.isArray(results.properties) ? results.properties.length : "NONE")

      const properties: SerpProperty[] = Array.isArray(results.properties)
        ? results.properties
        : []

      serpHotels = properties
        .filter((p) => p.gps_coordinates && p.rate_per_night?.extracted_lowest)
        .map((p, idx) => {
          const lat = p.gps_coordinates!.latitude
          const lng = p.gps_coordinates!.longitude
          const distKm =
            Math.round(haversineKm(officeLat, officeLng, lat, lng) * 100) / 100
          const rate = p.rate_per_night!.extracted_lowest!
          const over = rate > hotelNightlyCapUsd

          return {
            id: `serp_hotel_${p.property_token ?? idx}`,
            name: p.name,
            location: {
              type: "Point" as const,
              coordinates: [lng, lat] as [number, number],
            },
            address: "",
            distanceFromOfficeKm: distKm,
            nightlyRateUsd: rate,
            amenities: mapSerpAmenities(p.amenities),
            preferred: false,
            overPolicyCap: over,
            excessAboveCapUsd: over
              ? Math.round((rate - hotelNightlyCapUsd) * 100) / 100
              : 0,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            totalCostUsd: Math.round(rate * nights * 100) / 100,
            source: "google_hotels" as const,
          } satisfies Hotel
        })
    } catch (err) {
      console.warn("[hotels/search] SerpAPI hotel search failed:", err)
    }
  } else {
    console.warn("[hotels/search] SERPAPI_KEY missing – skipping live hotel search")
  }

  // ── 3. Merge & de-duplicate ────────────────────────────────
  // Preferred vendors win if a live result has the same name.
  const preferredNames = new Set(
    preferredHotels.map((h) => h.name.toLowerCase())
  )
  const deduped = serpHotels.filter(
    (h) => !preferredNames.has(h.name.toLowerCase())
  )

  // Cross-check: mark any SerpAPI results whose name matches a
  // preferred vendor but wasn't caught by exact match above.
  // (Already handled by Set filter, but this is a safety net.)

  // Preferred first, then SerpAPI results sorted by distance.
  const combined = [
    ...preferredHotels,
    ...deduped.sort((a, b) => a.distanceFromOfficeKm - b.distanceFromOfficeKm),
  ]

  return combined
}
