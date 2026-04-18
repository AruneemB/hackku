// ============================================================
// LIB: Hotel Geo Search (Frame 3)
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Uses MongoDB $geoNear aggregation to find
//   preferred vendors within radiusKm of the destination
//   office coordinates. Also enriches raw hotel search results
//   with preferred=true flag by matching against the DB.
//
//   Requires 2dsphere index on preferred_vendors.location
//   (see src/lib/mongodb/models/PreferredVendor.ts)
//
// USAGE:
//   const nearby = await findVendorsNearOffice({
//     lat: 45.4654, lng: 9.1866, radiusKm: 5, country: "IT"
//   })
// ============================================================

import clientPromise from "@/lib/mongodb/client"
import type { Hotel, GeoPoint, HotelAmenity } from "@/types"

interface GeoSearchParams {
  lat: number
  lng: number
  radiusKm: number
  country: string
  type?: "hotel" | "airline"
}

interface VendorDoc {
  _id: { toString(): string }
  name: string
  location: GeoPoint
  address: string
  amenities: HotelAmenity
  nightlyRateUsd: number
  country: string
  distMeters: number
}

export async function findVendorsNearOffice(
  params: GeoSearchParams
): Promise<(VendorDoc & { distMeters: number })[]> {
  const client = await clientPromise
  const db = client.db("hackku")

  const results = await db
    .collection("preferred_vendors")
    .aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [params.lng, params.lat] },
          distanceField: "distMeters",
          maxDistance: params.radiusKm * 1000, // convert km → meters
          spherical: true,
          query: {
            country: params.country,
            type: params.type ?? "hotel",
          },
        },
      },
      { $limit: 10 },
    ])
    .toArray()

  return results as (VendorDoc & { distMeters: number })[]
}

export async function markPreferredVendors(
  hotels: Hotel[],
  country: string
): Promise<Hotel[]> {
  const client = await clientPromise
  const db = client.db("hackku")

  const vendors = await db
    .collection("preferred_vendors")
    .find({ country, type: "hotel" }, { projection: { name: 1 } })
    .toArray()

  const preferredNames = new Set(vendors.map((v) => (v.name as string).toLowerCase()))

  return hotels.map((h) => ({
    ...h,
    preferred: preferredNames.has(h.name.toLowerCase()),
  }))
}
