// ============================================================
// HOOK: useTrip
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Manages trip document state. Fetches from
//   /api/trips/[id] and provides mutation helpers that call
//   the appropriate API routes. Uses optimistic updates so
//   the UI feels instant.
//
// USAGE:
//   const { trip, isLoading, updateStatus, addReceipt } = useTrip(tripId)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import type { Trip, TripBundle, TripStatus } from "@/types/trip";
import type { Flight } from "@/types/flight";

export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch trip");
      }
      const data = await response.json();
      setTrip(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId, fetchTrip]);

  const selectBundle = async (bundle: TripBundle) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedBundle: bundle }),
      });
      if (!response.ok) throw new Error("Failed to select bundle");
      const updatedTrip = await response.json();
      setTrip(updatedTrip);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  const updateStatus = async (status: TripStatus) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      const updatedTrip = await response.json();
      setTrip(updatedTrip);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  const updateFlights = async (flights: Flight[]) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flights }),
      });
      if (!response.ok) throw new Error("Failed to update flights");
      const updatedTrip = await response.json();
      setTrip(updatedTrip);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    }
  };

  return { trip, isLoading, error, selectBundle, updateStatus, updateFlights, refresh: fetchTrip };
}
