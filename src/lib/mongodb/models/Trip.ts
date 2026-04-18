// ============================================================
// MODEL: Trip (Mongoose schema — Polymorphic)
// OWNER: Track C (Data & Integrations)
// COLLECTION: trips
// DESCRIPTION: Central document. status field is the source of
//   truth for the entire UI flow. receipts[].total is Decimal128
//   for financial precision. An Atlas Trigger watches this
//   collection to detect approval status changes from Gmail.
//
// INDEXES:
//   - userId: 1
//   - status: 1
//   - "destination.country": 1
//
// EXAMPLE DOC → see src/types/trip.ts
// ============================================================

// TODO: import { Schema, model, models, Types } from "mongoose"
// TODO: const ReceiptSubSchema = new Schema({ merchant, category,
//         total: Types.Decimal128, currency, date, sanitized })
// TODO: const TripSchema = new Schema({
//         userId: { type: Schema.Types.ObjectId, ref: "User" },
//         status: { type: String, enum: ["draft", "pending_approval",
//           "approved", "rejected", "active", "archived"] },
//         destination: { city, country, officeLat, officeLng },
//         dates: { departure: Date, return: Date },
//         selectedBundle: Mixed,
//         flights: [Mixed],
//         hotels: [Mixed],
//         receipts: [ReceiptSubSchema],
//         policyFindings: Mixed,
//         approvalThread: { gmailThreadId, status, reason },
//         totalSpend: Types.Decimal128,
//         budgetCap: Types.Decimal128
//       }, { timestamps: true })
// TODO: export default models.Trip || model("Trip", TripSchema)
