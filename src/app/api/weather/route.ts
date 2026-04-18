// ============================================================
// API ROUTE: Weather Forecast
// OWNER: Track C (Data & Integrations)
// ROUTE: GET /api/weather?city=Milan&country=IT
// DESCRIPTION: Proxies OpenWeatherMap requests server-side
//   so the API key is not exposed to the browser.
//   Returns a 5-day daily forecast used for:
//   - Frame 8: Gemini packing list generation
//   - Frame 9: Live dashboard weather widget
//
// RESPONSE (200):
// {
//   "city": "Milan", "country": "IT",
//   "currentTempC": 22, "currentCondition": "Partly Cloudy",
//   "days": [
//     { "date": "2025-09-14", "tempHighC": 25, "tempLowC": 16, "condition": "Clear" },
//     { "date": "2025-09-15", "tempHighC": 23, "tempLowC": 15, "condition": "Clouds" },
//     { "date": "2025-09-16", "tempHighC": 19, "tempLowC": 14, "condition": "Rain" }
//   ]
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { getWeatherForecast } from "@/lib/weather/forecast"

// TODO: export async function GET(req: NextRequest) {
//   // const city = req.nextUrl.searchParams.get("city")
//   // const country = req.nextUrl.searchParams.get("country")
//   // const forecast = await getWeatherForecast(city!, country!)
//   // return NextResponse.json(forecast)
// }
