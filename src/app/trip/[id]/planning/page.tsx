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
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { useTrip } from "@/hooks/useTrip";
import { useMascot } from "@/hooks/useMascot";
import { Mascot } from "@/components/mascot/Mascot";
import type { Flight } from "@/types/flight";

/**
 * PAGE: Trip Planning
 * ROUTE: /trip/[id]/planning
 * DESCRIPTION: The main research and selection flow.
 *   Orchestrates flight search and selection (Frame 2).
 */
export default function PlanningPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { trip, isLoading: isTripLoading, updateFlights } = useTrip(tripId);
  const { flights, isLoading: isSearchLoading, error: searchError, search } = useFlightSearch();
  const { say } = useMascot();

  const [hasSearched, setHasSearched] = useState(false);

  const triggerSearch = useCallback(() => {
    if (!trip || hasSearched) return;
    
    setHasSearched(true);
    
    const cityToIata: Record<string, string> = {
      "Milan": "MXP",
      "London": "LHR",
      "Paris": "CDG",
      "Tokyo": "NRT",
      "Toronto": "YYZ",
      "Mexico City": "MEX"
    };

    const destinationIata = cityToIata[trip.destination.city] || "MXP";

    search({
      homeAirport: "MCI",
      destination: destinationIata,
      targetDeparture: new Date(trip.dates.departure).toISOString().split("T")[0],
      targetReturn: new Date(trip.dates.return).toISOString().split("T")[0],
      windowDays: 5,
      radiusMiles: 100
    });
  }, [trip, hasSearched, search]);

  // Trigger search when trip data is available
  useEffect(() => {
    if (!trip || hasSearched) return;
    queueMicrotask(() => {
      triggerSearch();
    });
  }, [trip, hasSearched, triggerSearch]);

  // Mascot reaction when results load
  useEffect(() => {
    if (hasSearched && !isSearchLoading && flights.length > 0) {
      say(`I've found some great flight options for your trip to ${trip?.destination.city}!`, "excited");
    }
  }, [hasSearched, isSearchLoading, flights, say, trip?.destination.city]);

  const handleSelectFlight = async (flight: Flight) => {
    // Pass the selected flight up to trip state
    // For Step 12, we store the selected flight in the flights array (or a dedicated field)
    // Here we'll update the trip's flights array with the selected one
    await updateFlights([flight]);
    say("Excellent choice! Now let's look at some hotels.", "neutral");
    // In a full implementation, this would trigger the next step (hotels)
  };

  if (isTripLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
      {/* Header / Destination Input (Read-only for now) */}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content: Flight Search Results */}
        <div className="lg:col-span-3">
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Flight Options</h2>
              <p className="text-sm text-gray-500 mt-1">We found these flights based on your preferred dates and nearby airports.</p>
            </div>

            {isSearchLoading ? (
              <div className="p-12 text-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 w-48 bg-gray-100 rounded"></div>
                </div>
                <p className="mt-4 text-gray-500">Searching for the best deals...</p>
              </div>
            ) : searchError ? (
              <div className="p-12 text-center text-red-500">
                <p>{searchError}</p>
                <button 
                  onClick={() => setHasSearched(false)}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : flights.length > 0 ? (
              <FlightGrid 
                flights={flights} 
                onSelect={handleSelectFlight}
                homeAirport="MCI"
              />
            ) : (
              <div className="p-12 text-center text-gray-500">
                No flights found for these criteria.
              </div>
            )}
          </section>
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

