// ============================================================
// MODEL: VisaRequirement (Mongoose schema)
// OWNER: Track C (Data & Integrations)
// COLLECTION: visa_requirements
// DESCRIPTION: Hardcoded lookup table for the demo. Only covers
//   US citizens visiting 6 countries: IT, GB, FR, JP, CA, MX.
//   Queried by lib/hotels/geoSearch.ts → actually by the visa
//   check API route at /api/visa/check.
//
// NOTE: In production this would be replaced by a live visa API.
//   For the hackathon, all data is seeded from data/visa/visa-requirements.json
//
// EXAMPLE DOC → see src/types/policy.ts → VisaRequirement
// ============================================================

// TODO: const VisaRequirementSchema = new Schema({
//         destinationCountry: String,  // ISO alpha-2
//         citizenship: String,
//         visaRequired: Boolean,
//         visaType: String,
//         stayLimitDays: Number,
//         notes: String,
//         applicationUrl: String
//       })
// TODO: VisaRequirementSchema.index({ destinationCountry: 1, citizenship: 1 }, { unique: true })
// TODO: export default models.VisaRequirement || model("VisaRequirement", ...)
