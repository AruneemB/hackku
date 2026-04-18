"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../../app/demo/page.module.css";

// Fix leaflet default icons in next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const officeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// A component to automatically fit the map bounds to all markers
function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && Array.isArray(bounds) && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
    }
  }, [map, bounds]);
  return null;
}

export default function LeafletHotelMap({ hotels, officeLat = 45.4654, officeLng = 9.1866, value, onChange }: { hotels: any[], officeLat?: number, officeLng?: number, value?: number, onChange?: (i: number) => void }) {
  const [localSel, setLocalSel] = useState(0);
  const sel = value ?? localSel;
  const setSel = onChange ?? setLocalSel;

  const defaultHotels = [
    { label: "H1", name: "Marriott Scala", dist: "0.4 km", price: "$247/n", preferred: true, lat: officeLat, lng: officeLng + 0.005 },
    { label: "H2", name: "AC Hotel Milan", dist: "1.2 km", price: "$189/n", preferred: true, lat: officeLat + 0.0108, lng: officeLng },
    { label: "H3", name: "NH Collection", dist: "2.1 km", price: "$165/n", preferred: false, lat: officeLat - 0.015, lng: officeLng - 0.01 },
  ];

  const displayHotels = hotels?.length
    ? hotels.map((h, i) => ({
        label: `H${i + 1}`,
        name: h.name,
        dist: `${h.distanceFromOfficeKm.toFixed(1)} km`,
        price: `$${h.nightlyRateUsd}/n`,
        preferred: !!h.preferred,
        lat: h.location?.coordinates ? h.location.coordinates[1] : defaultHotels[i % defaultHotels.length].lat,
        lng: h.location?.coordinates ? h.location.coordinates[0] : defaultHotels[i % defaultHotels.length].lng,
      }))
    : defaultHotels;

  // Build bounds matching the office and all hotels
  const bounds: L.LatLngTuple[] = [
    [officeLat, officeLng],
    ...displayHotels.map(h => [h.lat, h.lng] as L.LatLngTuple)
  ];

  return (
    <div className={styles.mapWrap}>
      <div style={{ height: 240, width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(159, 171, 183, 0.25)", position: "relative", zIndex: 1 }}>
        <MapContainer
          center={[officeLat, officeLng]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          attributionControl={false}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[officeLat, officeLng]} icon={officeIcon}>
            <Popup><strong>Client Office</strong></Popup>
          </Marker>
          {displayHotels.map((h, i) => (
            <Marker key={i} position={[h.lat, h.lng]} icon={customIcon}>
              <Popup>
                <strong>{h.name}</strong><br />
                {h.dist} • {h.price}
              </Popup>
            </Marker>
          ))}
          <MapBounds bounds={bounds} />
        </MapContainer>
      </div>

      <div className={styles.mapLegend}>
        <div className={styles.mapLegendItem}><span className={styles.mapDotDark} />Client office</div>
        <div className={styles.mapLegendItem}><span className={styles.mapDotAccent} />Hotels</div>
      </div>

      <div className={styles.cards}>
        {displayHotels.map((h, i) => (
          <button
            className={[styles.card, sel === i ? styles.cardSelected : ""].join(" ")}
            key={h.label}
            onClick={() => setSel(i)}
            type="button"
          >
            <div className={styles.cardRow}>
              <span className={styles.cardMain}>
                <span className={styles.hotelBadge} style={{ marginRight: 8, transform: 'scale(0.85)' }}>{h.label}</span>
                {h.name}
              </span>
              <span className={styles.cardPrice}>{h.price}</span>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardMeta}>{h.dist} from office</span>
              {h.preferred && <span className={styles.cardMeta}>⭐ Preferred</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
