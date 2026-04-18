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

// TODO: import mongoose, { Schema, model, models } from "mongoose"
// TODO: const PassportSchema = new Schema({ number, expiry: Date, country })
// TODO: const UserSchema = new Schema({ name, email, citizenship, passport,
//         department, managerId, homeAirports: [String] }, { timestamps: true })
// TODO: export default models.User || model("User", UserSchema)
