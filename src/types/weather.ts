// ============================================================
// TYPE: WeatherForecast
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Returned by lib/weather/forecast.ts (OpenWeatherMap
//   5-day API). Used in Frame 8 (packing list via Gemini) and
//   Frame 9 (live dashboard current conditions).
// ============================================================

export interface DayForecast {
  date: string;         // YYYY-MM-DD
  tempHighC: number;
  tempLowC: number;
  condition: string;    // e.g. "Rain", "Clear", "Clouds"
  icon: string;         // OpenWeatherMap icon code, e.g. "10d"
}

export interface WeatherForecast {
  city: string;
  country: string;      // ISO 3166-1 alpha-2
  days: DayForecast[];
  currentTempC: number;
  currentCondition: string;
}
