// ============================================================
// COMPONENT: HotelMap
// OWNER: Track A (Frontend & UX)
// FRAME: 3 — Proximity-Based Hotel Search
// DESCRIPTION: Renders a map showing the client office + hotel
//   locations using GeoJSON coordinates. Preferred vendors are
//   highlighted with a star marker.
//
//   Recommended library: react-leaflet (lightweight, free, OSM tiles)
//   Alternative: Google Maps JS SDK (requires API key)
//
// PROPS:
//   hotels: Hotel[]
//   officeLat: number
//   officeLng: number
// ============================================================

// TODO: "use client"
// TODO: import type { Hotel } from "@/types"
// For Leaflet: import dynamic from "next/dynamic" (avoids SSR issues)

// TODO: interface HotelMapProps {
//   hotels: Hotel[];
//   officeLat: number;
//   officeLng: number;
// }

// TODO: export function HotelMap({ hotels, officeLat, officeLng }: HotelMapProps) {
//   // Center map on officeLat/officeLng
//   // Pin for office: 🏢 blue marker
//   // Pin for each hotel: ⭐ gold if preferred, 📍 gray if not
//   // Click pin → shows HotelCard popup
// }
