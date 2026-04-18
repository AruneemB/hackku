// ============================================================
// LIB: Weather Forecast (OpenWeatherMap)
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Fetches a 5-7 day weather forecast for the
//   destination city. Used in two places:
//   - Frame 8: Gemini uses forecast to generate packing list
//   - Frame 9: Live dashboard displays current conditions
//
// ENV REQUIRED: OPENWEATHERMAP_KEY
// API: https://openweathermap.org/forecast5 (free tier, 5-day/3hr)
//
// USAGE:
//   const forecast = await getWeatherForecast("Milan", "IT")
// ============================================================

// TODO: interface DayForecast {
//   date: string;       // YYYY-MM-DD
//   tempHighC: number;
//   tempLowC: number;
//   condition: string;  // e.g. "Rain", "Clear", "Clouds"
//   icon: string;       // OpenWeatherMap icon code
// }

// TODO: export interface WeatherForecast {
//   city: string;
//   country: string;
//   days: DayForecast[];
//   currentTempC: number;
//   currentCondition: string;
// }

// TODO: export async function getWeatherForecast(city: string, country: string): Promise<WeatherForecast> {
//   // GET https://api.openweathermap.org/data/2.5/forecast
//   //   ?q={city},{country}&units=metric&appid={key}
//
//   // Group 3-hour intervals into daily summaries
//
//   // EXAMPLE RETURN for Milan:
//   // {
//   //   "city": "Milan", "country": "IT",
//   //   "currentTempC": 22, "currentCondition": "Partly Cloudy",
//   //   "days": [
//   //     { "date": "2025-09-14", "tempHighC": 25, "tempLowC": 16, "condition": "Clear" },
//   //     { "date": "2025-09-15", "tempHighC": 23, "tempLowC": 15, "condition": "Clouds" },
//   //     { "date": "2025-09-16", "tempHighC": 19, "tempLowC": 14, "condition": "Rain" },
//   //     { "date": "2025-09-17", "tempHighC": 21, "tempLowC": 15, "condition": "Clear" },
//   //     { "date": "2025-09-18", "tempHighC": 24, "tempLowC": 16, "condition": "Clear" }
//   //   ]
//   // }
// }
