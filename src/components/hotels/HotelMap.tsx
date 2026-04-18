// ============================================================
// COMPONENT: HotelMap
// OWNER: Track A (Frontend & UX)
// FRAME: 3 — Proximity-Based Hotel Search
// DESCRIPTION: Renders a map showing the client office + hotel
//   locations using GeoJSON coordinates. Preferred vendors are
//   highlighted with a star marker.
//
//   Uses react-leaflet with OpenStreetMap tiles (no API key).
//   Loaded via next/dynamic (ssr: false) to avoid SSR crash.
//
// PROPS:
//   hotels: Hotel[]
//   officeLat: number
//   officeLng: number
// ============================================================

"use client"

import dynamic from "next/dynamic"
import type { Hotel } from "@/types"

export interface HotelMapProps {
  hotels: Hotel[]
  officeLat: number
  officeLng: number
}

// Dynamically import the inner map so Leaflet never runs on the server
const HotelMapInner = dynamic(() => import("./HotelMapInner"), { ssr: false })

export function HotelMap(props: HotelMapProps) {
  return (
    <div className="w-full h-72 rounded-xl overflow-hidden border border-gray-800">
      <HotelMapInner {...props} />
    </div>
  )
}
