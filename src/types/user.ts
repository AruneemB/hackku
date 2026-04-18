// ============================================================
// TYPE: User
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Represents a corporate traveler stored in the
//   `users` MongoDB collection. Passport expiry is stored as
//   a Date so we can run the 6-month expiry check in dates.ts.
// ============================================================

export interface Passport {
  number: string; // stored redacted/masked in DB
  expiry: Date;   // ISODate — used for 6-month warning logic
  country: string; // ISO 3166-1 alpha-2, e.g. "US"
}

export interface User {
  _id: string;
  name: string;
  email: string;
  citizenship: string;    // ISO 3166-1 alpha-2, e.g. "US"
  passport: Passport;
  department: string;
  managerId: string;      // ObjectId ref → another User
  homeAirports: string[]; // IATA codes, e.g. ["MCI"]
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------------
// EXAMPLE document returned from MongoDB:
// {
//   "_id": "664f1a2b3c4d5e6f7a8b9c0d",
//   "name": "Kelli Thompson",
//   "email": "kelli.thompson@lockton.com",
//   "citizenship": "US",
//   "passport": {
//     "number": "XXXXXXXXX",
//     "expiry": "2026-03-15T00:00:00.000Z",   ← expiring soon!
//     "country": "US"
//   },
//   "department": "Risk Management",
//   "managerId": "664f1a2b3c4d5e6f7a8b9c01",
//   "homeAirports": ["MCI"],
//   "createdAt": "2024-01-10T09:00:00.000Z"
// }
// -------------------------------------------------------
