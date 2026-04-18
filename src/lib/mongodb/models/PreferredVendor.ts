// ============================================================
// MODEL: PreferredVendor (Mongoose schema)
// OWNER: Track C (Data & Integrations)
// COLLECTION: preferred_vendors
// DESCRIPTION: Company-approved hotels and airlines with
//   GeoJSON Point locations. The 2dsphere index enables
//   lib/hotels/geoSearch.ts to run $geoNear queries to find
//   vendors within X km of the client office.
//
// INDEXES:
//   - location: "2dsphere"   ← REQUIRED for $geoNear to work
//   - type: 1, country: 1
//
// SEEDED: ~3 hotels per demo city (Milan, London, Paris,
//          Tokyo, Toronto, Mexico City)
//
// EXAMPLE DOC → see src/types/hotel.ts
// ============================================================

import { Schema, model, models } from "mongoose"

const PreferredVendorSchema = new Schema({
  type: { type: String, enum: ["hotel", "airline"] },
  name: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] }, // [lng, lat]
  },
  address: String,
  amenities: {
    freeBreakfast: Boolean,
    wifi: Boolean,
    gym: Boolean,
    parking: Boolean,
  },
  nightlyRateUsd: Number,
  preferred: { type: Boolean, default: true },
  city: String,
  country: String,
  contactPhone: String,
})

PreferredVendorSchema.index({ location: "2dsphere" })

export default models.PreferredVendor || model("PreferredVendor", PreferredVendorSchema)
