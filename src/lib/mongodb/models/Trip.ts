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

import { Schema, model, models, Types } from "mongoose"

const ReceiptSubSchema = new Schema({
  merchant: String,
  category: { type: String, enum: ["meal", "transport", "hotel", "other"], default: "other" },
  total: Types.Decimal128,
  currency: String,
  originalAmount: Types.Decimal128,
  date: Date,
  sanitized: { type: Boolean, default: false },
  extractedByAI: { type: Boolean, default: true },
  imageUrl: { type: String, default: null },
})

const TripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected", "active", "archived"],
      default: "draft",
    },
    destination: { city: String, country: String, officeLat: Number, officeLng: Number },
    dates: { departure: Date, return: Date },
    selectedBundle: Schema.Types.Mixed,
    flights: [Schema.Types.Mixed],
    hotels: [Schema.Types.Mixed],
    receipts: [ReceiptSubSchema],
    policyFindings: Schema.Types.Mixed,
    approvalThread: {
      gmailThreadId: { type: String, default: null },
      status: { type: String, default: null },
      reason: { type: String, default: null },
    },
    totalSpend: {
      type: Types.Decimal128,
      default: () => Types.Decimal128.fromString("0.00"),
    },
    budgetCap: {
      type: Types.Decimal128,
      default: () => Types.Decimal128.fromString("2800.00"),
    },
  },
  { timestamps: true }
)

export default models.Trip || model("Trip", TripSchema)
