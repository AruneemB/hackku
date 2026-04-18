// ============================================================
// API ROUTE: Live Flight Status (TimeSeries)
// OWNER: Track C (Data & Integrations)
// ROUTE: GET /api/flights/live?flightNumber=AA2345
// DESCRIPTION: Returns the latest status event from the
//   flight_status TimeSeries collection. Called every 30s
//   by useFlightStatus hook.
//
//   For the demo, you can POST mock status updates to this
//   endpoint to simulate a delay/cancellation during the
//   live demo presentation.
//
// GET RESPONSE (200):
// {
//   "timestamp": "2025-09-14T15:30:00.000Z",
//   "flightNumber": "AA2345",
//   "status": "delayed",
//   "gate": "B22",
//   "delayMinutes": 47,
//   "destination": "MXP"
// }
//
// POST (demo trigger — inject a delay for the demo):
// { "flightNumber": "AA2345", "status": "delayed", "delayMinutes": 47 }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { getLatestFlightStatus, writeFlightStatus } from "@/lib/mongodb/models/FlightStatus"

// TODO: export async function GET(req: NextRequest) {
//   // const flightNumber = req.nextUrl.searchParams.get("flightNumber")
//   // const status = await getLatestFlightStatus(flightNumber!)
//   // return NextResponse.json(status)
// }

// TODO: export async function POST(req: NextRequest) {
//   // Demo trigger: inject a flight status event
//   // const update = await req.json()
//   // await writeFlightStatus(update)
//   // return NextResponse.json({ success: true })
// }
