"use client";

import { useState, useEffect } from "react";
import type { FlightStatusUpdate } from "@/types";

export function useFlightStatus(flightNumber: string, intervalMs = 30000) {
  const [status, setStatus] = useState<FlightStatusUpdate | null>(null);

  useEffect(() => {
    if (!flightNumber) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/flights/live?flightNumber=${encodeURIComponent(flightNumber)}`);
        if (!res.ok) return;
        const data: FlightStatusUpdate = await res.json();
        setStatus(data);
      } catch {
        // network error — keep last known status
      }
    };

    poll();
    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [flightNumber, intervalMs]);

  return {
    status,
    isDelayed: status?.status === "delayed",
    isCancelled: status?.status === "cancelled",
    delayMinutes: status?.delayMinutes ?? 0,
    gate: status?.gate ?? null,
  };
}
