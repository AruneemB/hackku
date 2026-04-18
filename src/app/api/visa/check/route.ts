import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import VisaRequirement from "@/lib/mongodb/models/VisaRequirement";

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
// ============================================================

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { destinationCountry, citizenship } = await req.json();

    const doc = await VisaRequirement.findOne({
      destinationCountry,
      citizenship,
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Visa requirement record not found for this destination and citizenship." },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error checking visa requirements:", error);
    return NextResponse.json(
      { error: "Internal server error while checking visa requirements." },
      { status: 500 }
    );
  }
}
