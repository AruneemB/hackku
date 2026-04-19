import { Schema, model, models } from "mongoose";

// ============================================================
// MODEL: VisaRequirement (Mongoose schema)
// OWNER: Track C (Data & Integrations)
// COLLECTION: visa_requirements
// DESCRIPTION: Hardcoded lookup table for the demo. Only covers
//   US citizens visiting 6 countries: IT, GB, FR, JP, CA, MX.
//   Queried by the visa check API route at /api/visa/check.
//
// INDEXES:
//   - destinationCountry: 1, citizenship: 1 (unique)
// ============================================================

const VisaRequirementSchema = new Schema(
  {
    destinationCountry: {
      type: String, // ISO alpha-2, e.g. "IT"
      required: true,
    },
    citizenship: {
      type: String, // e.g. "US"
      required: true,
    },
    visaRequired: {
      type: Boolean,
      required: true,
    },
    visaType: {
      type: String, // e.g. "Schengen 90-day" or null
      default: null,
    },
    stayLimitDays: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      required: true,
    },
    applicationUrl: {
      type: String,
      default: null,
    },
    minApplicationLeadDays: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique compound index for lookups
VisaRequirementSchema.index({ destinationCountry: 1, citizenship: 1 }, { unique: true });

export default models.VisaRequirement || model("VisaRequirement", VisaRequirementSchema);
