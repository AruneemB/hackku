// ============================================================
// API ROUTE: Visa Check
// OWNER: Track C (Data & Integrations)
// ROUTE: POST /api/visa/check
// DESCRIPTION: Looks up visa requirements from the seeded
//   visa_requirements collection. Supports only the 6 demo
//   countries (IT, GB, FR, JP, CA, MX) for US citizens.
//
// REQUEST BODY:
// { "destinationCountry": "IT", "citizenship": "US" }
//
// RESPONSE (200):
// {
//   "destinationCountry": "IT",
//   "citizenship": "US",
//   "visaRequired": false,
//   "visaType": null,
//   "stayLimitDays": 90,
//   "notes": "Schengen Area — no visa for US citizens up to 90 days",
//   "applicationUrl": null
// }
//
// RESPONSE (200, visa required example — Japan):
// {
//   "destinationCountry": "JP",
//   "visaRequired": false,
//   "stayLimitDays": 90,
//   "notes": "US citizens can visit Japan without a visa for up to 90 days."
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import VisaRequirement from "@/lib/mongodb/models/VisaRequirement"

// TODO: export async function POST(req: NextRequest) {
//   // const { destinationCountry, citizenship } = await req.json()
//   // const doc = await VisaRequirement.findOne({ destinationCountry, citizenship })
//   // if (!doc) return 404
//   // return NextResponse.json(doc)
// }
