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

// TODO: interface HotelSearchParams {
//   city: string;
//   country: string;
//   checkIn: string;    // YYYY-MM-DD
//   checkOut: string;
//   maxResultsPerNight?: number; // cap for demo
// }

// TODO: export async function searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
//   // Option A: SerpAPI Google Hotels
//   // Option B: Return preferred vendors from MongoDB + supplement with API results
//
//   // EXAMPLE RETURN:
//   // [
//   //   { id: "hotel_marriott_milan", name: "Marriott Milan",
//   //     nightlyRateUsd: 185, preferred: true, distanceFromOfficeKm: 0.8 },
//   //   { id: "hotel_nh_collection", name: "NH Collection Milano",
//   //     nightlyRateUsd: 159, preferred: false, distanceFromOfficeKm: 2.1 },
//   //   { id: "hotel_bulgari", name: "Bulgari Hotel Milano",
//   //     nightlyRateUsd: 890, preferred: false, distanceFromOfficeKm: 1.2 }
//   // ]
// }
