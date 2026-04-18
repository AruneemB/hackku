"use client";

import { useLiveTracking } from "@/hooks/useLiveTracking";
import { CrisisAlert } from "./CrisisAlert";
import type { Trip } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  on_time: "On Time",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  on_time: "text-green-400",
  delayed: "text-yellow-400",
  cancelled: "text-red-400",
};

export function LiveDashboard({ trip }: { trip: Trip }) {
  const { flightStatus, weather, isInCrisis, delayMinutes, isCancelled, gate } = useLiveTracking(trip);

  if (isInCrisis) {
    return (
      <CrisisAlert
        tripId={trip._id}
        delayMinutes={delayMinutes}
        isCancelled={isCancelled}
      />
    );
  }

  const outbound = trip.selectedBundle?.flight?.outbound;
  const statusKey = flightStatus?.status ?? "on_time";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Live Travel Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {trip.destination.city}, {trip.destination.country}
        </p>
      </div>

      {/* Flight status card */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-200">Flight Status</h2>
          <span className={`font-bold text-sm ${STATUS_COLOR[statusKey] ?? "text-gray-400"}`}>
            {STATUS_LABEL[statusKey] ?? "Unknown"}
          </span>
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          {outbound && (
            <>
              <div>{outbound.carrier} · {outbound.flightNumber}</div>
              <div>{outbound.origin} → {outbound.destination}</div>
              <div>Departs: {new Date(outbound.departureTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </>
          )}
          {gate && <div className="text-white font-medium">Gate: {gate}</div>}
          {flightStatus?.status === "delayed" && (
            <div className="text-yellow-300">Delay: {delayMinutes} min</div>
          )}
        </div>
      </div>

      {/* Weather card */}
      {weather && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">
            Weather in {weather.city}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-light text-white">{Math.round(weather.currentTempC)}°C</div>
            <div className="text-gray-400 text-sm">{weather.currentCondition}</div>
          </div>
        </div>
      )}

      {/* Hotel card */}
      {trip.selectedBundle?.hotel && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Hotel</h2>
          <div className="text-sm text-gray-400 space-y-1">
            <div className="text-white font-medium">{trip.selectedBundle.hotel.name}</div>
            <div>{trip.selectedBundle.hotel.address}</div>
            <div>${trip.selectedBundle.hotel.pricePerNightUsd}/night</div>
          </div>
        </div>
      )}
    </div>
  );
}
