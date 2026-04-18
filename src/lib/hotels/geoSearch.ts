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

// TODO: import clientPromise from "@/lib/mongodb/client"

// TODO: interface GeoSearchParams {
//   lat: number;
//   lng: number;
//   radiusKm: number;
//   country: string;
//   type?: "hotel" | "airline";
// }

// TODO: export async function findVendorsNearOffice(params: GeoSearchParams) {
//   // Run MongoDB $geoNear aggregation:
//   // db.collection("preferred_vendors").aggregate([
//   //   { $geoNear: {
//   //     near: { type: "Point", coordinates: [params.lng, params.lat] },
//   //     distanceField: "distanceFromOfficeKm",
//   //     maxDistance: params.radiusKm * 1000,  // meters
//   //     spherical: true,
//   //     query: { country: params.country, type: params.type ?? "hotel" }
//   //   }},
//   //   { $limit: 10 }
//   // ])
//
//   // EXAMPLE RETURN:
//   // [
//   //   { name: "Marriott Milan", distanceFromOfficeKm: 0.8, nightlyRateUsd: 185 },
//   //   { name: "Hilton Garden Inn Milan", distanceFromOfficeKm: 1.4, nightlyRateUsd: 172 }
//   // ]
// }

// TODO: export async function markPreferredVendors(hotels: Hotel[], country: string): Promise<Hotel[]> {
//   // Cross-reference hotel names with preferred_vendors collection
//   // Set hotel.preferred = true if found
// }
