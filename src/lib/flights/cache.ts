import type { Flight, FlightSearchParams } from "@/types/flight";

interface CacheEntry {
  data: Flight[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

function getCacheKey(params: FlightSearchParams): string {
  // Keyed on (origin, destination, date, returnDate)
  // We also include adults to be safe, although not explicitly requested
  const { origin, destination, date, returnDate, adults } = params;
  return `${origin}|${destination}|${date}|${returnDate || ""}|${adults || 1}`;
}

/**
 * Wraps a flight search function with an in-memory cache.
 */
export async function withFlightCache(
  params: FlightSearchParams,
  searchFn: (params: FlightSearchParams) => Promise<Flight[]>
): Promise<Flight[]> {
  const key = getCacheKey(params);
  const now = Date.now();
  const entry = cache.get(key);

  if (entry && now < entry.expiresAt) {
    console.log(`[Cache] Hit for ${key}`);
    return entry.data;
  }

  if (entry && now >= entry.expiresAt) {
    console.log(`[Cache] Expired for ${key}`);
    cache.delete(key);
  }

  console.log(`[Cache] Miss for ${key}. Fetching...`);
  const data = await searchFn(params);

  cache.set(key, {
    data,
    expiresAt: now + DEFAULT_TTL_MS,
  });

  return data;
}

/**
 * Manual cache clear if needed (e.g. for testing)
 */
export function clearFlightCache(): void {
  cache.clear();
}
