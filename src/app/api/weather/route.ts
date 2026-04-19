import { NextRequest, NextResponse } from "next/server";
import { getWeatherForecast } from "@/lib/weather/forecast";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const country = req.nextUrl.searchParams.get("country");

  if (!city || !country) {
    return NextResponse.json({ error: "city and country required" }, { status: 400 });
  }

  try {
    const forecast = await getWeatherForecast(city, country);
    return NextResponse.json(forecast);
  } catch {
    return NextResponse.json({ error: "weather unavailable" }, { status: 503 });
  }
}
