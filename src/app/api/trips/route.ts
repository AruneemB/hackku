// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb/client";
import Trip from "@/lib/mongodb/models/Trip";
import User from "@/lib/mongodb/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/google/oauth";
import { Types } from "mongoose";

export async function GET() {
  return NextResponse.json({ message: "scaffold" });
}

export async function POST(req: NextRequest) {
  try {
    const [, session] = await Promise.all([
      connectToDatabase(),
      getServerSession(authOptions),
    ]);

    let userId: Types.ObjectId | string | undefined;

    if (session?.user?.email) {
      const userDoc = await User.findOne({ email: session.user.email }).select("_id").lean<{ _id: Types.ObjectId }>();
      if (userDoc) {
        userId = userDoc._id;
      }
    }

    if (!userId) {
      const defaultUser = await User.findOne({ email: "lockey.thompson@lockton.com" }).select("_id").lean<{ _id: Types.ObjectId }>();
      userId = defaultUser ? defaultUser._id : new Types.ObjectId();
    }

    const body = (await req.json()) as {
      destination: { city: string; country: string; officeLat: number; officeLng: number };
      dates: { departure: string; return: string };
    };

    const trip = await Trip.create({
      userId,
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
