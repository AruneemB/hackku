import { Schema, model, models } from "mongoose";

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
// ============================================================

const PreferredVendorSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["hotel", "airline"],
      required: true,
    },
    name: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: { type: String },
    contactPhone: { type: String },
    amenities: {
      freeBreakfast: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
    },
    nightlyRateUsd: { type: Number },
    preferred: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Enable geospatial queries
PreferredVendorSchema.index({ location: "2dsphere" });
PreferredVendorSchema.index({ type: 1, country: 1 });

export default models.PreferredVendor || model("PreferredVendor", PreferredVendorSchema);
