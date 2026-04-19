// @ts-nocheck
// ============================================================
// API ROUTE: Current user profile
// ROUTE: GET /api/users/me
// DESCRIPTION: Returns the authenticated user's name and
//   department from the users collection. Used by the demo
//   page to replace hardcoded traveler info.
//
// RESPONSE (200): { name: string; department: string; email: string }
// RESPONSE (401): not signed in
// RESPONSE (404): user not in DB (falls back gracefully on client)
// ============================================================

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/google/oauth";
import { connectToDatabase } from "@/lib/mongodb/client";
import UserModel from "@/lib/mongodb/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  await connectToDatabase();
  const user = await UserModel.findOne({ email: session.user.email })
    .select("name department email")
    .lean();

  if (!user) {
    return NextResponse.json({
      name: session.user.name ?? "",
      department: "",
      email: session.user.email,
    });
  }

  return NextResponse.json({
    name: user.name,
    department: user.department,
    email: user.email,
  });
}
