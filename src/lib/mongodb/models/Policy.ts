// ============================================================
// MODEL: Policy (Mongoose schema)
// OWNER: Track C (Data & Integrations)
// COLLECTION: policies
// DESCRIPTION: One document per demo city. handbookExcerpt is
//   the raw text that gets embedded by Gemini and stored in the
//   embedding field. Atlas Vector Search index must be created
//   on the embedding field (run scripts/create-vector-index.ts).
//
// ATLAS VECTOR SEARCH INDEX:
//   Field: embedding | Type: vector | Dimensions: 768 | Similarity: cosine
//
// SEEDED CITIES: MIL (Milan), LON (London), PAR (Paris),
//                TYO (Tokyo), YTO (Toronto), MEX (Mexico City)
//
// EXAMPLE DOC → see src/types/policy.ts
// ============================================================

import { Schema, model, models } from "mongoose";

const PolicySchema = new Schema(
  {
    cityCode: { type: String, required: true },
    country: { type: String, required: true }, // ISO 3166-1 alpha-2
    hotelNightlyCapUsd: { type: Number, required: true },
    flightCapUsd: { type: Number, required: true },
    mealAllowancePerDayUsd: { type: Number, required: true },
    preferredTransport: [{ type: String }],
    requiresApprovalAboveUsd: { type: Number, required: true },
    handbookExcerpt: { type: String, required: true },
    embedding: { type: [Number], required: true, index: false }, // atlas manages the index
  },
  { timestamps: true }
);

export default models.Policy || model("Policy", PolicySchema);
