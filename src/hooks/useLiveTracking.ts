"use client";

import { useState, useEffect, useRef } from "react";
import { useFlightStatus } from "./useFlightStatus";
import { useMascot } from "./useMascot";
import type { Trip, WeatherForecast } from "@/types";

const CONNECTION_BUFFER_MINUTES = 45;

export function useLiveTracking(trip: Trip | null) {
  const flightNumber = trip?.selectedBundle?.flight?.outbound?.flightNumber ?? "";
  const { status: flightStatus, isDelayed, isCancelled, delayMinutes, gate } = useFlightStatus(flightNumber);

  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const mascot = useMascot();
  const alreadyAlerted = useRef(false);

  const isInCrisis = isDelayed && delayMinutes > CONNECTION_BUFFER_MINUTES;
  const isCrisisOrCancelled = isInCrisis || isCancelled;

  useEffect(() => {
    if (!trip?.destination) return;
    const { city, country } = trip.destination;
    fetch(`/api/weather?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setWeather(data))
      .catch(() => null);
  }, [trip?.destination?.city, trip?.destination?.country]);

  useEffect(() => {
    if (isCrisisOrCancelled && !alreadyAlerted.current) {
      alreadyAlerted.current = true;
      const reason = isCancelled
        ? "Your flight has been cancelled."
        : `Your flight is delayed by ${delayMinutes} minutes — that's past your connection window.`;
      mascot.say(`Kelli, heads up. ${reason} I've already found alternative options for you.`, "urgent");
    }
  }, [isCrisisOrCancelled, isCancelled, delayMinutes]);

  useEffect(() => {
    if (gate && flightStatus?.status === "on_time") {
      mascot.say(`Your departure gate is ${gate}. Everything looks on schedule.`, "neutral");
    }
  }, [gate]);

  return {
    flightStatus,
    weather,
    isInCrisis: isCrisisOrCancelled,
    isDelayed,
    isCancelled,
    delayMinutes,
    gate,
  };
}
