// ============================================================
// COMPONENT: HotelCard
// OWNER: Track A (Frontend & UX)
// FRAME: 3 and 5 (inside BundleCard)
// DESCRIPTION: Displays a single hotel result with proximity,
//   amenities, rate vs policy cap, and preferred vendor badge.
//
// PROPS:
//   hotel: Hotel
//   policyCapUsd: number
//   compact?: boolean
//   onSelect?: (hotel: Hotel) => void
//
// EXAMPLE DISPLAY:
//   ⭐ [PREFERRED] Marriott Milan
//   📍 0.8 km from client office
//   🍳 Free breakfast  📶 WiFi  💪 Gym
//   $185/night  [✅ Within $200 cap]
//   5 nights = $925 total
// ============================================================

"use client"

import type { Hotel } from "@/types"

interface HotelCardProps {
  hotel: Hotel
  policyCapUsd: number
  compact?: boolean
  onSelect?: (hotel: Hotel) => void
}

export function HotelCard({ hotel, policyCapUsd, compact = false, onSelect }: HotelCardProps) {
  const nights = hotel.totalCostUsd && hotel.nightlyRateUsd
    ? Math.round(hotel.totalCostUsd / hotel.nightlyRateUsd)
    : null

  return (
    <div className={`bg-gray-900 border rounded-2xl p-4 flex flex-col gap-3 ${
      hotel.overPolicyCap ? "border-red-900" : "border-gray-800"
    }`}>
      {/* Name + badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-white">{hotel.name}</p>
          {!compact && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{hotel.address}</p>
          )}
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
              Within ${policyCapUsd} cap
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className={`grid gap-2 text-center ${nights ? "grid-cols-3" : "grid-cols-2"}`}>
        <Stat label="Distance" value={`${hotel.distanceFromOfficeKm} km`} />
        <Stat label="/night" value={`$${hotel.nightlyRateUsd}`} highlight={!hotel.overPolicyCap} />
        {nights && <Stat label={`${nights}n total`} value={`$${hotel.totalCostUsd}`} />}
      </div>

      {/* Amenities */}
      {!compact && (
        <div className="flex gap-2 flex-wrap">
          {hotel.amenities.freeBreakfast && <Pill label="Breakfast" />}
          {hotel.amenities.wifi          && <Pill label="WiFi" />}
          {hotel.amenities.gym           && <Pill label="Gym" />}
          {hotel.amenities.parking       && <Pill label="Parking" />}
        </div>
      )}

      {onSelect && (
        <button
          onClick={() => onSelect(hotel)}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-white font-semibold py-2 rounded-xl text-sm"
        >
          Select Hotel
        </button>
      )}
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
