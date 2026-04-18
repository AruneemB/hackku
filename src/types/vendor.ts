import type { GeoPoint, HotelAmenity } from "./hotel";

// ============================================================
// TYPE: PreferredVendor
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Represents a company-approved hotel or airline.
//   Stored in the `preferred_vendors` collection.
// ============================================================

export interface PreferredVendor {
  _id: string;
  type: "hotel" | "airline";
  name: string;
  city: string;
  country: string; // ISO 3166-1 alpha-2
  location: GeoPoint;
  address?: string;
  contactPhone?: string;
  amenities?: HotelAmenity;
  nightlyRateUsd?: number;
  preferred: boolean;
  createdAt: Date;
  updatedAt: Date;
}
