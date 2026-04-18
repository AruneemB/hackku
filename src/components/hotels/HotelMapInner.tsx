"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { HotelMapProps } from "./HotelMap"

// Fix Webpack/Next.js stripping Leaflet's default icon image paths
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

function makeIcon(emoji: string, bgColor: string) {
  return L.divIcon({
    html: `<div style="
      background:${bgColor};
      width:32px;height:32px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "><span style="transform:rotate(45deg);font-size:14px;line-height:1">${emoji}</span></div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 32],
    popupAnchor:[0, -34],
    className:  "",
  })
}

const officeIcon   = makeIcon("🏢", "#2563eb")
const preferredIcon = makeIcon("⭐", "#d97706")
const normalIcon   = makeIcon("📍", "#6b7280")

export default function HotelMapInner({ hotels, officeLat, officeLng }: HotelMapProps) {
  useEffect(() => { fixLeafletIcons() }, [])

  return (
    <MapContainer
      center={[officeLat, officeLng]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Office marker */}
      <Marker position={[officeLat, officeLng]} icon={officeIcon}>
        <Popup>
          <strong>Client Office</strong>
        </Popup>
      </Marker>

      {/* Hotel markers */}
      {hotels.map((hotel) => {
        const [lng, lat] = hotel.location.coordinates
        return (
          <Marker
            key={hotel.id}
            position={[lat, lng]}
            icon={hotel.preferred ? preferredIcon : normalIcon}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{hotel.name}</p>
                <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
                  {hotel.distanceFromOfficeKm} km from office
                </p>
                <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>
                  ${hotel.nightlyRateUsd}/night
                  {hotel.overPolicyCap && (
                    <span style={{ color: "#dc2626", marginLeft: 4 }}>over cap</span>
                  )}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
