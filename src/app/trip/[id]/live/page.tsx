"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { LiveDashboard } from "@/components/travel/LiveDashboard";
import { useTrip } from "@/hooks/useTrip";

export default function LivePage() {
  const params = useParams<{ id: string }>();
  const { trip, isLoading } = useTrip(params.id);
  const [hasLanded, setHasLanded] = useState(false);

  if (isLoading || !trip) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading live dashboard…</p>
      </main>
    );
  }

  if (hasLanded) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4 p-6">
        <div className="text-5xl">🛬</div>
        <h1 className="text-2xl font-bold">Welcome to {trip.destination.city}</h1>
        <p className="text-gray-400 text-sm">
          Hotel: {trip.selectedBundle?.hotel?.name ?? "—"} · Meal allowance: ${trip.policyFindings?.mealAllowancePerDayUsd ?? 75}/day
        </p>
        <a
          href={`/trip/${trip._id}/post-trip`}
          className="mt-4 px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Start Post-Trip →
        </a>
      </main>
    );
  }

  return (
    <div className="relative">
      <LiveDashboard trip={trip} />
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40">
        <button
          onClick={() => setHasLanded(true)}
          className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-green-500 transition-colors"
        >
          I've Landed →
        </button>
      </div>
    </div>
  );
}

