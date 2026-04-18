// ============================================================
// MODEL: User (Mongoose schema)
// OWNER: Track C (Data & Integrations)
// COLLECTION: users
// DESCRIPTION: Corporate traveler profile. passport.expiry is
//   stored as a native Date so Atlas can query date ranges.
//   Use lib/utils/dates.ts → isPassportExpiringSoon() to
//   check the 6-month rule.
//
// INDEXES:
//   - email: unique
//
// EXAMPLE DOC → see src/types/user.ts
// ============================================================

import { Schema, model, models } from "mongoose";

const PassportSchema = new Schema(
  {
    number: { type: String, required: true },
    expiry: { type: Date, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    citizenship: { type: String, required: true },
    passport: { type: PassportSchema, required: true },
    department: { type: String, required: true },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    homeAirports: [{ type: String }],
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
