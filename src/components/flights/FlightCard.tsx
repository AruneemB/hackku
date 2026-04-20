// ============================================================
// COMPONENT: FlightCard
// OWNER: Track A (Frontend & UX)
// FRAME: 2 and 5 (inside BundleCard)
// DESCRIPTION: Displays a single flight result. Shows origin,
//   destination, carrier, duration, price, and the Saturday-
//   night savings badge if applicable.
//
// PROPS:
//   flight: Flight
//   compact?: boolean   (true = condensed view inside BundleCard)
//   homeAirport?: string  (shows alt-airport warning if different)
//
// EXAMPLE DISPLAY:
//   MCI → MXP  |  AA 2345  |  9h 30m
//   Sep 14, 8:00 AM → Sep 14, 10:30 PM
//   $1,240   [🌙 Sat-night saves $180]
// ============================================================

"use client"

import type { Flight, FlightLeg } from "@/types"

interface FlightCardProps {
  flight: Flight
  compact?: boolean
  homeAirport?: string
}

export function FlightCard({ flight, compact = false, homeAirport }: FlightCardProps) {
  const { outbound: out, inbound: back } = flight
  const altAirport = homeAirport && flight.originAirport !== homeAirport

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
      {/* Route + badges */}
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-white">
          {out.origin} → {out.destination}
        </p>
        <div className="flex gap-1 flex-wrap justify-end shrink-0">
          {flight.saturdayNightStay && flight.saturdayNightSavingsUsd > 0 && (
            <span className="text-xs bg-green-900/60 text-green-300 border border-green-800 px-2 py-0.5 rounded-full">
              Sat saves ${flight.saturdayNightSavingsUsd}
            </span>
          )}
          {altAirport && (
            <span className="text-xs bg-yellow-900/60 text-yellow-300 border border-yellow-800 px-2 py-0.5 rounded-full">
              Alt airport +{flight.distanceFromHomeAirportMiles} mi
            </span>
          )}
        </div>
      </div>

      {/* Outbound leg */}
      <LegRow leg={out} label="Outbound" compact={compact} />

      {/* Return leg (hidden in compact mode) */}
      {!compact && back && (
        <>
          <div className="border-t border-gray-800" />
          <LegRow leg={back} label="Return" compact={compact} />
        </>
      )}

      {/* Stats row */}
      <div className={`grid gap-2 text-center ${flight.saturdayNightStay ? "grid-cols-3" : "grid-cols-2"}`}>
        <Stat label="Price" value={`$${flight.priceUsd.toLocaleString()}`} highlight />
        <Stat label="Duration" value={fmtDuration(out.durationMinutes)} />
        {flight.saturdayNightStay && (
          <Stat label="Stops" value={out.layoverAirports?.length ? String(out.layoverAirports.length) : "Nonstop"} />
        )}
      </div>
    </div>
  )
}

function LegRow({ leg, label, compact }: { leg: FlightLeg; label: string; compact: boolean }) {
  const dep = new Date(leg.departureTime)
  const arr = new Date(leg.arrivalTime)
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
  const stops = leg.layoverAirports?.length ? leg.layoverAirports.join(" · ") : "Nonstop"

  return (
    <div className="flex flex-col gap-0.5">
      {!compact && <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-white font-medium">
            {leg.carrier} {leg.flightNumber}
          </p>
          {!compact && <p className="text-xs text-gray-400">{stops}</p>}
        </div>
        <p className="text-xs text-gray-400 text-right shrink-0">
          {fmtTime(dep)} → {fmtTime(arr)}
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-800 rounded-lg py-2 px-1">
      <p className={`text-sm font-semibold ${highlight ? "text-green-400" : "text-white"}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
