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

// TODO: const PolicySchema = new Schema({
//         cityCode: String,
//         country: String,
//         hotelNightlyCapUsd: Number,
//         flightCapUsd: Number,
//         mealAllowancePerDayUsd: Number,
//         preferredTransport: [String],
//         requiresApprovalAboveUsd: Number,
//         handbookExcerpt: String,
//         embedding: { type: [Number], index: false }  ← atlas manages the index
//       })
// TODO: export default models.Policy || model("Policy", PolicySchema)
