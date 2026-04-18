// ============================================================
// API ROUTE: Trips Collection
// OWNER: Track C (Data & Integrations)
// ROUTE: /api/trips
//
// GET  → List all trips for the authenticated user
// POST → Create a new draft trip document
//
// POST REQUEST BODY:
// {
//   "destination": { "city": "Milan", "country": "IT",
//     "officeLat": 45.4654, "officeLng": 9.1866 },
//   "dates": { "departure": "2025-09-14", "return": "2025-09-19" }
// }
//
// POST RESPONSE (201):
// {
//   "_id": "665a2b3c4d5e6f7a8b9c0d1e",
//   "status": "draft",
//   "destination": { "city": "Milan", "country": "IT" },
//   "budgetCapUsd": "2800.00",
//   "createdAt": "2025-07-01T10:00:00.000Z"
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { getServerSession } from "next-auth"
// TODO: import Trip from "@/lib/mongodb/models/Trip"

// TODO: export async function GET(req: NextRequest) {
//   // Verify session → get userId
//   // Query Trip.find({ userId }) sorted by createdAt desc
//   // Return trip list
// }

// TODO: export async function POST(req: NextRequest) {
//   // Verify session
//   // Parse body: { destination, dates }
//   // Look up policy.budgetCapUsd for destination.country
//   // Create Trip document with status: "draft"
//   // Return created trip
// }
