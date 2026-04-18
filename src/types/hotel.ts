// ============================================================
// TYPE: Hotel
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: A hotel result from geo search. GeoJSON Point
//   is used for MongoDB $geoNear queries. preferred flag is
//   set by cross-referencing against the preferred_vendors
//   collection. nightly_rate compared against policy cap.
// ============================================================

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface HotelAmenity {
  freeBreakfast: boolean;
  wifi: boolean;
  gym: boolean;
  parking: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  location: GeoPoint;
  address: string;
  distanceFromOfficeKm: number;    // calculated by geoSearch
  nightlyRateUsd: number;
  amenities: HotelAmenity;
  preferred: boolean;              // on company preferred vendor list
  overPolicyCap: boolean;          // nightlyRateUsd > policy cap
  excessAboveCapUsd: number;       // 0 if within cap
  checkIn: Date;
  checkOut: Date;
  totalCostUsd: number;
  source: "google_hotels" | "booking_api" | "preferred_vendors_db";
}

// -------------------------------------------------------
// EXAMPLE hotel result near Milan client office:
// {
//   "id": "hotel_marriott_milan",
//   "name": "Marriott Milan",
//   "location": { "type": "Point", "coordinates": [9.19, 45.467] },
//   "address": "Via Washington 66, 20146 Milano",
//   "distanceFromOfficeKm": 0.8,
//   "nightlyRateUsd": 185,
//   "amenities": {
//     "freeBreakfast": true, "wifi": true, "gym": true, "parking": false
//   },
//   "preferred": true,
//   "overPolicyCap": false,
//   "excessAboveCapUsd": 0,
//   "totalCostUsd": 925,
//   "source": "preferred_vendors_db"
// }
// -------------------------------------------------------
