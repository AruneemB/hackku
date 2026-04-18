"use client"

// ============================================================
// PAGE: Hotel Geo Search (Standalone Sketch)
// ROUTE: /hotels
// OWNER: Track C (Data & Integrations) + Track A (Frontend)
// FRAME: 3 — Hotel results near destination office
// DESCRIPTION: Standalone test page for Step 10. Demonstrates
//   MongoDB $geoNear against the preferred_vendors collection.
//   Will be embedded in /trip/[id]/planning when integrated.
//
// FLOW:
//   1. Seed DB button → POST /api/hotels/seed (one-time)
//   2. Select city + check-in/out dates
//   3. POST /api/hotels/search → Hotel[] sorted by distance
//   4. Hotel cards: distance, rate, policy cap status, amenities
// ============================================================

import { useState } from "react"
import type { Hotel } from "@/types"

const CITIES = [
  { city: "Milan",       country: "IT", cap: 200 },
  { city: "London",      country: "GB", cap: 250 },
  { city: "Paris",       country: "FR", cap: 220 },
  { city: "Tokyo",       country: "JP", cap: 180 },
  { city: "Toronto",     country: "CA", cap: 175 },
  { city: "Mexico City", country: "MX", cap: 140 },
]

interface SearchMeta {
  city: string
  hotelNightlyCapUsd: number
  nights: number
}

export default function HotelsPage() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [checkIn,  setCheckIn]  = useState("2025-09-14")
  const [checkOut, setCheckOut] = useState("2025-09-19")
  const [hotels,   setHotels]   = useState<Hotel[] | null>(null)
  const [meta,     setMeta]     = useState<SearchMeta | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [seedMsg,  setSeedMsg]  = useState<string | null>(null)
  const [seeding,  setSeeding]  = useState(false)

  async function seedDatabase() {
    setSeeding(true)
    setSeedMsg(null)
    try {
      const res = await fetch("/api/hotels/seed", { method: "POST" })
      const data = await res.json()
      setSeedMsg(res.ok ? `✓ ${data.message}` : `✗ ${data.error}`)
    } catch (e) {
      setSeedMsg(`✗ ${e instanceof Error ? e.message : "Failed"}`)
    } finally {
      setSeeding(false)
    }
  }

  async function searchHotels() {
    setLoading(true)
    setError(null)
    setHotels(null)
    try {
      const res = await fetch("/api/hotels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: selectedCity.city,
          country: selectedCity.country,
          checkIn,
          checkOut,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Search failed")
      setHotels(data.hotels)
      setMeta(data.meta)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Hotel Geo Search</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Step 10 · MongoDB $geoNear · preferred_vendors
          </p>
        </div>

        {/* Seed */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            One-time Setup
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={seedDatabase}
              disabled={seeding}
              className="bg-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 active:scale-95 transition-all"
            >
              {seeding ? "Seeding…" : "Seed Database"}
            </button>
            {seedMsg && (
              <span className={`text-sm ${seedMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {seedMsg}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            Seeds 9 preferred vendors + creates 2dsphere index. Safe to re-run.
          </p>
        </div>

        {/* Search form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Search</p>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Destination City</label>
            <select
              value={selectedCity.city}
              onChange={(e) => setSelectedCity(CITIES.find(c => c.city === e.target.value)!)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CITIES.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} ({c.country}) — cap ${c.cap}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={searchHotels}
            disabled={loading}
            className="bg-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? "Searching…" : "Search Hotels"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Running $geoNear…
          </div>
        )}

        {/* Results */}
        {hotels && meta && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {hotels.length} hotel{hotels.length !== 1 ? "s" : ""} near {meta.city} office
              </p>
              <p className="text-xs text-gray-500">
                {meta.nights} night{meta.nights !== 1 ? "s" : ""} · cap ${meta.hotelNightlyCapUsd}/night
              </p>
            </div>

            {hotels.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-6">
                No preferred vendors found within 10km. Try seeding the database first.
              </p>
            )}

            {hotels.map((h) => (
              <HotelCard key={h.id} hotel={h} cap={meta.hotelNightlyCapUsd} nights={meta.nights} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function HotelCard({ hotel, cap, nights }: { hotel: Hotel; cap: number; nights: number }) {
  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 flex flex-col gap-3 ${
      hotel.overPolicyCap ? "border-red-900" : "border-gray-800"
    }`}>
      {/* Name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{hotel.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{hotel.address}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {hotel.preferred && (
            <span className="text-xs bg-blue-900/60 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full">
              Preferred
            </span>
          )}
          {hotel.overPolicyCap ? (
            <span className="text-xs bg-red-900/60 text-red-300 border border-red-800 px-2 py-0.5 rounded-full">
              Over cap +${hotel.excessAboveCapUsd}
            </span>
          ) : (
            <span className="text-xs bg-green-900/60 text-green-300 border border-green-800 px-2 py-0.5 rounded-full">
              Within cap
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Distance" value={`${hotel.distanceFromOfficeKm} km`} />
        <Stat label={`/night`} value={`$${hotel.nightlyRateUsd}`} highlight={!hotel.overPolicyCap} />
        <Stat label={`${nights}n total`} value={`$${hotel.totalCostUsd}`} />
      </div>

      {/* Amenities */}
      <div className="flex gap-2 flex-wrap">
        {hotel.amenities.freeBreakfast && <Pill label="Breakfast" />}
        {hotel.amenities.wifi         && <Pill label="WiFi" />}
        {hotel.amenities.gym          && <Pill label="Gym" />}
        {hotel.amenities.parking      && <Pill label="Parking" />}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-800 rounded-lg py-2 px-1">
      <p className={`text-sm font-semibold ${highlight ? "text-green-400" : "text-white"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
      {label}
    </span>
  )
}
