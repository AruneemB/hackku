import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";

export async function GET() {
  return NextResponse.json({ message: "scaffold" });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = (await req.json()) as {
      destination: { city: string; country: string; officeLat: number; officeLng: number };
      dates: { departure: string; return: string };
    };

    const trip = await Trip.create({
      userId: "demo-kelli-001",
      destination: body.destination,
      dates: {
        departure: new Date(body.dates.departure),
        return: new Date(body.dates.return),
      },
      status: "draft",
      budgetCapUsd: 2800,
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("Trip POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
