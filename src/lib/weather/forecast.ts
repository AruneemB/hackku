import type { WeatherForecast } from "@/types/weather";

interface OWMItem {
  dt_txt: string;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: { main: string; icon: string }[];
}

interface OWMResponse {
  city: { name: string; country: string };
  list: OWMItem[];
}

export async function getWeatherForecast(city: string, country: string): Promise<WeatherForecast> {
  const key = process.env.OPENWEATHERMAP_KEY;
  if (!key) throw new Error("OPENWEATHERMAP_KEY not set");

  const q = `${encodeURIComponent(city)},${encodeURIComponent(country)}`;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&units=metric&appid=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`OpenWeatherMap error ${res.status}`);

  const data: OWMResponse = await res.json();

  const byDay: Record<string, OWMItem[]> = {};
  for (const item of data.list) {
    const date = item.dt_txt.slice(0, 10);
    (byDay[date] ??= []).push(item);
  }

  const days = Object.entries(byDay)
    .slice(0, 5)
    .map(([date, items]) => {
      const mid = items[Math.floor(items.length / 2)];
      return {
        date,
        tempHighC: Math.round(Math.max(...items.map((i) => i.main.temp_max))),
        tempLowC: Math.round(Math.min(...items.map((i) => i.main.temp_min))),
        condition: mid.weather[0].main,
        icon: mid.weather[0].icon,
      };
    });

  const current = data.list[0];
  return {
    city: data.city.name,
    country: data.city.country,
    currentTempC: Math.round(current.main.temp),
    currentCondition: current.weather[0].main,
    days,
  };
}
