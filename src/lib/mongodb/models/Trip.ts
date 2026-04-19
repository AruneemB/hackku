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

import { Schema, model, models } from "mongoose";

const ReceiptSubSchema = new Schema(
  {
    merchant: { type: String, required: true },
    category: {
      type: String,
      enum: ["meal", "transport", "hotel", "other"],
      required: true,
    },
    total: { type: Number, required: true },
    currency: { type: String, required: true },
    originalAmount: { type: Number, default: null },
    date: { type: Date, required: true },
    sanitized: { type: Boolean, default: false },
    extractedByAI: { type: Boolean, default: true },
    imageUrl: { type: String, default: null },
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
      country: { type: String, required: true },
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
    exceptionRequest: {
      subject: { type: String, default: null },
      body: { type: String, default: null },
      requestedAt: { type: Date, default: null },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected", null],
        default: null,
      },
    },
    rebooking: {
      originalFlightNumber: { type: String, default: null },
      originalCarrier: { type: String, default: null },
      originalPriceUsd: { type: Number, default: null },
      newFlightNumber: { type: String, default: null },
      newCarrier: { type: String, default: null },
      newPriceUsd: { type: Number, default: null },
      changeFeeUsd: { type: Number, default: null },
      overageUsd: { type: Number, default: null },
      reason: { type: String, default: null },
      rebookedAt: { type: Date, default: null },
    },
    totalSpendUsd: { type: Number, default: 0 },
    budgetCapUsd: { type: Number, required: true },
  },
  { timestamps: true }
);

TripSchema.index({ userId: 1 });
TripSchema.index({ status: 1 });
TripSchema.index({ "destination.country": 1 });

export default models.Trip || model("Trip", TripSchema);
