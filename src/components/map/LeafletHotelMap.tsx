"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../../app/demo/page.module.css";

type HotelPin = {
  label: string;
  name: string;
  dist: string;
  price: string;
  preferred: boolean;
  lat: number;
  lng: number;
};

function createHotelIcon(num: number, selected: boolean) {
  const size = selected ? 32 : 26;
  const opacity = selected ? "1" : "0.42";
  const fontSize = selected ? 13 : 11;
  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;background:#f35b4f;border-radius:50%;opacity:${opacity};"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-57.5%);font-size:${fontSize}px;font-weight:700;color:#fff;font-family:-apple-system,system-ui,sans-serif;line-height:1;user-select:none;">${num}</span></div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function createOfficeIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:30px;height:30px;background:#1a2530;border-radius:8px;"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);line-height:0;"><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='13' height='13'><path d='M6 2v20h12V2H6zm4 16H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V8h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z'/></svg></span></div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -17],
  });
}

function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && Array.isArray(bounds) && (bounds as L.LatLngTuple[]).length > 0) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
    }
  }, [map, bounds]);
  return null;
}

export default function LeafletHotelMap({
  hotels,
  officeLat = 45.4654,
  officeLng = 9.1866,
  value,
  onChange,
}: {
  hotels: any[];
  officeLat?: number;
  officeLng?: number;
  value?: number;
  onChange?: (i: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [localSel, setLocalSel] = useState(0);
  const sel = value ?? localSel;
  const setSel = onChange ?? setLocalSel;

  useEffect(() => { setMounted(true); }, []);

  const defaultHotels: HotelPin[] = [
    { label: "1", name: "Marriott Scala", dist: "0.4 km", price: "$247", preferred: true, lat: officeLat, lng: officeLng + 0.005 },
    { label: "2", name: "AC Hotel Milan", dist: "1.2 km", price: "$189", preferred: true, lat: officeLat + 0.0108, lng: officeLng },
    { label: "3", name: "NH Collection", dist: "2.1 km", price: "$165", preferred: false, lat: officeLat - 0.015, lng: officeLng - 0.01 },
  ];

  const displayHotels: HotelPin[] = hotels?.length
    ? hotels.map((h, i) => ({
        label: `${i + 1}`,
        name: h.name,
        dist: `${h.distanceFromOfficeKm.toFixed(1)} km`,
        price: `$${h.nightlyRateUsd}`,
        preferred: !!h.preferred,
        lat: h.location?.coordinates ? h.location.coordinates[1] : defaultHotels[i % defaultHotels.length].lat,
        lng: h.location?.coordinates ? h.location.coordinates[0] : defaultHotels[i % defaultHotels.length].lng,
      }))
    : defaultHotels;

  const bounds: L.LatLngTuple[] = [
    [officeLat, officeLng],
    ...displayHotels.map((h) => [h.lat, h.lng] as L.LatLngTuple),
  ];

  return (
    <div className={styles.mapWrap}>
      <div className={styles.hotelMapContainer}>
        {!mounted ? null : <MapContainer
          center={[officeLat, officeLng]}
          zoom={13}
          style={{ height: 220, width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          dragging={true}
          touchZoom={true}
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[officeLat, officeLng]} icon={createOfficeIcon()}>
            <Popup><strong>Client Office</strong></Popup>
          </Marker>
          {displayHotels.map((h, i) => (
            <Marker
              key={`hotel-${i}-${sel === i}`}
              position={[h.lat, h.lng]}
              icon={createHotelIcon(i + 1, sel === i)}
              eventHandlers={{ click: () => setSel(i) }}
            >
              <Popup>
                <strong>{h.name}</strong><br />{h.dist} · {h.price}/night
              </Popup>
            </Marker>
          ))}
          <MapBounds bounds={bounds} />
        </MapContainer>}
      </div>

      <div className={styles.mapLegend}>
        <div className={styles.mapLegendItem}>
          <span className={styles.mapDotOffice} />
          Client office
        </div>
        <div className={styles.mapLegendItem}>
          <span className={styles.mapDotAccent} />
          Hotels (tap to select)
        </div>
      </div>

      <div className={styles.fpCards}>
        {displayHotels.map((h, i) => {
          const isSelected = sel === i;
          return (
            <button
              key={h.label}
              className={[styles.fpCard, isSelected ? styles.fpCardSelected : ""].join(" ")}
              onClick={() => setSel(i)}
              type="button"
            >
              <div className={styles.fpCardTop}>
                <span className={styles.fpAirline}>
                  {h.preferred ? "Preferred vendor" : "3rd party"}
                </span>
                {h.preferred && (
                  <span className={[styles.cardTag, isSelected ? styles.cardTagSelected : ""].join(" ")}>
                    Preferred
                  </span>
                )}
              </div>
              <div className={styles.hotelCardName}>
                <span className={styles.hotelBadge}>{h.label}</span>
                <span className={styles.hotelCardNameText}>{h.name}</span>
              </div>
              <div className={styles.fpCardBottom}>
                <span className={styles.fpStopsMeta}>{h.dist} from office</span>
                <span className={styles.hotelCardPrice}>{h.price}/night</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
