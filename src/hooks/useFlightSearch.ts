// ============================================================
// HOOK: useFlightSearch
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Wraps the POST /api/flights/search call with 
//   loading/error state. Returns { flights, isLoading, error, search }. 
//   Called from the trip planning page (Frame 2) when the user 
//   confirms origin/destination/dates.
//
// USAGE:
//   const { flights, isLoading, error, search } = useFlightSearch()
//   search({ homeAirport: "MCI", destination: "MXP", ... })
// ============================================================

import { useState } from "react";
import type { Flight } from "@/types/flight";

export interface FairGridSearchParams {
  homeAirport: string;
  destination: string;
  targetDeparture: string; // ISO string (YYYY-MM-DD)
  targetReturn: string;    // ISO string (YYYY-MM-DD)
  windowDays?: number;
  radiusMiles?: number;
}

export function useFlightSearch() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executes a flight search using the Fair Grid algorithm.
   */
  const search = async (params: FairGridSearchParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flights/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from the API
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(", "));
        }
        throw new Error(data.message || "Failed to fetch flights");
      }

      setFlights(data);
    } catch (err: any) {
      console.error("useFlightSearch error:", err);
      setError(err.message || "An error occurred while searching for flights");
      setFlights([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { flights, isLoading, error, search };
}
