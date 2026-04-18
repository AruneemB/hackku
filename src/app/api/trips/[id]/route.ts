// ============================================================
// API ROUTE: Single Trip
// OWNER: Track C (Data & Integrations)
// ROUTE: /api/trips/[id]
//
// GET    → Fetch trip by ID (with all nested data)
// PATCH  → Update trip fields (status, selectedBundle, etc.)
// DELETE → Hard delete (admin/debug only)
//
// PATCH REQUEST BODY (examples):
//   { "status": "active" }
//   { "selectedBundle": { "label": "B", "flight": {...}, "hotel": {...} } }
//
// GET RESPONSE:
// {
//   "_id": "665a2b3c4d5e6f7a8b9c0d1e",
//   "status": "approved",
//   "destination": { "city": "Milan", "country": "IT" },
//   "selectedBundle": { "label": "B", "totalCostUsd": 1980 },
//   "policyFindings": { "visa": {...}, "hotelNightlyCapUsd": 200 },
//   "approvalThread": { "gmailThreadId": "abc123", "status": "approved" }
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import Trip from "@/lib/mongodb/models/Trip"

// TODO: export async function GET(req: NextRequest, { params }: { params: { id: string } }) {}
// TODO: export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {}
// TODO: export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {}
