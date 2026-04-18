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

import { Schema, model, models, Types } from "mongoose";

const ReceiptSubSchema = new Schema(
  {
    merchant: { type: String, required: true },
    category: {
      type: String,
      enum: ["meal", "transport", "hotel", "other"],
      required: true,
    },
    total: { type: Types.Decimal128, required: true },
    currency: { type: String, required: true },
    date: { type: Date, required: true },
    sanitized: { type: Boolean, default: false },
  },
  { _id: false }
);

const TripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "active",
        "archived",
      ],
      required: true,
      default: "draft",
    },
    destination: {
      city: { type: String, required: true },
      country: { type: String, required: true }, // ISO 3166-1 alpha-2
      officeLat: { type: Number, required: true },
      officeLng: { type: Number, required: true },
    },
    dates: {
      departure: { type: Date, required: true },
      return: { type: Date, required: true },
    },
    selectedBundle: { type: Schema.Types.Mixed, default: null },
    flights: { type: [Schema.Types.Mixed], default: [] },
    hotels: { type: [Schema.Types.Mixed], default: [] },
    receipts: { type: [ReceiptSubSchema], default: [] },
    policyFindings: { type: Schema.Types.Mixed, default: null },
    approvalThread: {
      gmailThreadId: { type: String, default: null },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", null],
        default: null,
      },
      reason: { type: String, default: null },
    },
    totalSpend: { type: Types.Decimal128, default: 0 },
    budgetCap: { type: Types.Decimal128, required: true },
  },
  { timestamps: true }
);

// Indexes
TripSchema.index({ userId: 1 });
TripSchema.index({ status: 1 });
TripSchema.index({ "destination.country": 1 });

export default models.Trip || model("Trip", TripSchema);
