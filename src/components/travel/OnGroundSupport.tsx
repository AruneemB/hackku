"use client";

// ============================================================
// COMPONENT: OnGroundSupport
// OWNER: Track A (Frontend & UX)
// FRAME: 12 — On-the-Ground Spatial Support
// DESCRIPTION: Shown after Lockey lands. Provides location-aware
//   guidance using the destination's GeoJSON data:
//   - Distance from airport to hotel (and preferred transport)
//   - Daily meal allowance reminder (from policy)
//   - Quick Dial button for local Lockton office
//   - Nearby preferred restaurants (if seeded in vendors)
//
// PROPS:
//   trip: Trip
//   policy: Policy
// ============================================================

import { useMemo } from "react";
import type { Trip } from "@/types/trip";
import { KNOWN_AIRPORTS, haversineDistanceMiles } from "@/lib/flights/airports";

const MILES_TO_KM = 1.60934;

export interface TransportMode {
  label: string;
  detail: string;
}

export interface AirportToHotelResult {
  distanceKm: number;
  airportName: string;
  transport: TransportMode;
  error?: never;
}

export interface AirportToHotelError {
  error: string;
  distanceKm?: never;
  airportName?: never;
  transport?: never;
}

export function getTransportMode(distanceKm: number): TransportMode {
  if (distanceKm < 3) return { label: "Walk / Rideshare", detail: "Close enough to walk or take a quick ride." };
  if (distanceKm < 15) return { label: "Rideshare", detail: "Grab a taxi or rideshare app." };
  return { label: "Company Car Recommended", detail: "Distance warrants pre-arranged company transport." };
}

export function computeAirportToHotelDistance(trip: Trip): AirportToHotelResult | AirportToHotelError {
  const flight = trip.selectedBundle?.flight;
  const hotel = trip.selectedBundle?.hotel;

  if (!flight || !hotel) return { error: "No bundle selected." };

  const iata = flight.outbound.destination;
  const airport = KNOWN_AIRPORTS.find((a) => a.code === iata);
  if (!airport) return { error: `Airport ${iata} not found in directory.` };

  // GeoPoint coordinates are [longitude, latitude]
  const [hotelLng, hotelLat] = hotel.location.coordinates;
  const distanceMiles = haversineDistanceMiles(airport.lat, airport.lng, hotelLat, hotelLng);
  const distanceKm = distanceMiles * MILES_TO_KM;

  return {
    distanceKm,
    airportName: airport.name,
    transport: getTransportMode(distanceKm),
  };
}

function useAirportToHotelDistance(trip: Trip): AirportToHotelResult | AirportToHotelError {
  return useMemo(() => computeAirportToHotelDistance(trip), [trip]);
}

interface Props {
  trip: Trip;
}

function buildUberUrl(hotel: NonNullable<Trip["selectedBundle"]>["hotel"]): string {
  const [lng, lat] = hotel.location.coordinates;
  const nickname = encodeURIComponent(hotel.name);
  return `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${nickname}`;
}

export function OnGroundSupport({ trip }: Props) {
  const result = useAirportToHotelDistance(trip);
  const hotel = trip.selectedBundle?.hotel;

  const actionButton = !("error" in result) && hotel
    ? (
      <a href={buildUberUrl(hotel)} target="_blank" rel="noopener noreferrer" className="action-btn uber-btn">
        Open in Uber
      </a>
    )
    : null;

  return (
    <div className="on-ground-support">
      <h2>On the Ground — {trip.destination.city}</h2>

      <section className="distance-card">
        {"error" in result ? (
          <p className="error">{result.error}</p>
        ) : (
          <>
            <p>
              <strong>{result.airportName}</strong> → {hotel?.name}
            </p>
            <p className="distance">
              ~{result.distanceKm.toFixed(1)} km
            </p>
            <p className="transport">
              <strong>{result.transport.label}</strong> — {result.transport.detail}
            </p>
            {actionButton}
          </>
        )}
      </section>
    </div>
  );
}
