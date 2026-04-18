// ============================================================
// PAGE: Trip Planning
// OWNER: Track A (Frontend & UX)
// ROUTE: /trip/[id]/planning
// DESCRIPTION: The main research and selection flow.
//   Orchestrates Frames 2-5 in sequence:
//
//   STEP 1 (Frame 2): FlightSearchStatus while fairGrid runs
//   STEP 2 (Frame 3): HotelMap + hotel results load
//   STEP 3 (Frame 4): PolicySummary displays visa + caps
//   STEP 4 (Frame 5): BundleSelector presents A/B/C bundles
//
//   Each step auto-advances when the previous API call completes.
//   Mascot narrates each transition.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { FlightGrid } from "@/components/flights/FlightGrid";
import { HotelCard } from "@/components/hotels/HotelCard"
import { HotelMap } from "@/components/hotels/HotelMap";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useTrip } from "@/hooks/useTrip";
import { useMascot } from "@/hooks/useMascot";
import { Mascot } from "@/components/mascot/Mascot";
import type { Flight } from "@/types/flight";
import type { Hotel } from "@/types/hotel";

type PlanningStep = "flights" | "hotels" | "policy" | "bundles";

interface HotelSearchResult {
  hotels: Hotel[]
  policyCapUsd: number
  officeLat: number
  officeLng: number
}

export default function PlanningPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { trip, isLoading: isTripLoading, updateFlights, updateHotels } = useTrip(tripId);
  const { flights, isLoading: isSearchLoading, error: searchError, search } = useFlightSearch();
  const { say, setThinking } = useMascot();

  const [step, setStep] = useState<PlanningStep>("flights");
  const [hasSearched, setHasSearched] = useState(false);
  const [hotelResult, setHotelResult] = useState<HotelSearchResult | null>(null);
  const [isHotelLoading, setIsHotelLoading] = useState(false);
  const [hotelError, setHotelError] = useState<string | null>(null);

  const triggerFlightSearch = useCallback(() => {
    if (!trip || hasSearched) return;
    setHasSearched(true);

    const cityToIata: Record<string, string> = {
      "Milan": "MXP", "London": "LHR", "Paris": "CDG",
      "Tokyo": "NRT", "Toronto": "YYZ", "Mexico City": "MEX",
    };

    search({
      homeAirport: "MCI",
      destination: cityToIata[trip.destination.city] ?? "MXP",
      targetDeparture: new Date(trip.dates.departure).toISOString().split("T")[0],
      targetReturn: new Date(trip.dates.return).toISOString().split("T")[0],
      windowDays: 5,
      radiusMiles: 100,
    });
  }, [trip, hasSearched, search]);

  useEffect(() => {
    if (!trip || hasSearched) return;
    queueMicrotask(() => triggerFlightSearch());
  }, [trip, hasSearched, triggerFlightSearch]);

  useEffect(() => {
    if (hasSearched && !isSearchLoading && flights.length > 0) {
      say(`I found ${flights.length} flight options to ${trip?.destination.city}. Pick the one that works best for you.`, "excited");
    }
  }, [hasSearched, isSearchLoading, flights, say, trip?.destination.city]);

  const handleSelectFlight = async (flight: Flight) => {
    await updateFlights([flight]);
    say("Great choice! Now let me find hotels near the office.", "neutral");
    setStep("hotels");
    loadHotels();
  };

  const loadHotels = useCallback(async () => {
    setIsHotelLoading(true);
    setHotelError(null);
    setThinking(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/hotels`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hotel search failed");
      setHotelResult(data);
      say(`I found ${data.hotels.length} hotels near the ${trip?.destination.city} office.`, "excited");
    } catch (err) {
      setHotelError(err instanceof Error ? err.message : "Hotel search failed");
    } finally {
      setIsHotelLoading(false);
      setThinking(false);
    }
  }, [tripId, trip?.destination.city, say, setThinking]);

  const handleSelectHotel = async (hotel: Hotel) => {
    const ok = await updateHotels([hotel]);
    if (!ok) {
      say("I had trouble saving your hotel selection. Please try again.", "empathetic");
      return;
    }
    say("Perfect! Let me check your travel policy compliance.", "neutral");
    setStep("policy");
  };

  if (isTripLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">Trip not found</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Trip header */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Planning your trip</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Destination</label>
            <div className="mt-1 text-lg font-semibold">{trip.destination.city}, {trip.destination.country}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Departure</label>
            <div className="mt-1 text-lg font-semibold">{new Date(trip.dates.departure).toLocaleDateString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Return</label>
            <div className="mt-1 text-lg font-semibold">{new Date(trip.dates.return).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-4 flex gap-2">
          {(["flights", "hotels", "policy", "bundles"] as PlanningStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? "bg-blue-600 text-white" :
                (["flights", "hotels", "policy", "bundles"].indexOf(step) > i) ? "bg-green-500 text-white" :
                "bg-gray-200 text-gray-500"
              }`}>
                {i + 1}
              </div>
              <span className="text-sm capitalize text-gray-600 hidden sm:inline">{s}</span>
              {i < 3 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">

          {/* ── Step 1: Flights ── */}
          {step === "flights" && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Flight Options</h2>
                <p className="text-sm text-gray-500 mt-1">Select a flight to continue to hotel selection.</p>
              </div>
              {isSearchLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                  </div>
                  <p className="mt-4 text-gray-500">Searching for the best deals...</p>
                </div>
              ) : searchError ? (
                <div className="p-12 text-center text-red-500">
                  <p>{searchError}</p>
                  <button onClick={() => setHasSearched(false)} className="mt-4 text-blue-600 hover:underline">
                    Try again
                  </button>
                </div>
              ) : flights.length > 0 ? (
                <FlightGrid flights={flights} onSelect={handleSelectFlight} homeAirport="MCI" />
              ) : (
                <div className="p-12 text-center text-gray-500">No flights found for these criteria.</div>
              )}
            </section>
          )}

          {/* ── Step 2: Hotels ── */}
          {step === "hotels" && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Hotels Near Office</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {hotelResult
                    ? `${hotelResult.hotels.length} preferred vendors within 25 km · cap $${hotelResult.policyCapUsd}/night`
                    : "Finding hotels near the client office…"}
                </p>
              </div>

              {isHotelLoading && (
                <div className="p-12 text-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                  </div>
                  <p className="mt-4 text-gray-500">Running geo search…</p>
                </div>
              )}

              {hotelError && (
                <div className="p-12 text-center text-red-500">
                  <p>{hotelError}</p>
                  <button onClick={loadHotels} className="mt-4 text-blue-600 hover:underline">
                    Try again
                  </button>
                </div>
              )}

              {hotelResult && !isHotelLoading && (
                <div className="p-4 flex flex-col gap-3">
                  {hotelResult.hotels.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No preferred vendors found. Try seeding the database at <code>/hotels</code>.
                    </p>
                  ) : (
                    <>
                      <HotelMap
                        hotels={hotelResult.hotels}
                        officeLat={hotelResult.officeLat}
                        officeLng={hotelResult.officeLng}
                      />
                      {hotelResult.hotels.map((hotel) => (
                        <HotelCard
                          key={hotel.id}
                          hotel={hotel}
                          policyCapUsd={hotelResult.policyCapUsd}
                          onSelect={handleSelectHotel}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Step 3: Policy (placeholder) ── */}
          {step === "policy" && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <p className="text-lg font-medium">Policy check coming in Step 11 (vector search).</p>
              <button
                onClick={() => setStep("bundles")}
                className="mt-4 bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-blue-500"
              >
                Continue to Bundles →
              </button>
            </section>
          )}

          {/* ── Step 4: Bundles (placeholder) ── */}
          {step === "bundles" && (
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <p className="text-lg font-medium">Bundle generation coming in Step 12.</p>
            </section>
          )}

        </div>

        {/* Sidebar: Mascot */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <Mascot />
          </div>
        </div>
      </div>
    </main>
  );
}
