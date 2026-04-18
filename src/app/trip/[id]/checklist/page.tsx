// ============================================================
// PAGE: Pre-Trip Checklist
// OWNER: Track A (Frontend & UX)
// ROUTE: /trip/[id]/checklist
// DESCRIPTION: Frame 8 — shown after approval.
//   Fetches weather forecast + generates packing list via Gemini.
//   Renders TripChecklist with all items pre-populated.
//   Mascot celebrates approval and walks through the checklist.
// ============================================================

// TODO: import { TripChecklist } from "@/components/trip/TripChecklist"
// TODO: import { getWeatherForecast } from "@/lib/weather/forecast"

// TODO: export default async function ChecklistPage({ params }: { params: { id: string } }) {
//   // const trip = await fetchTrip(params.id)
//   // const weather = await getWeatherForecast(trip.destination.city, trip.destination.country)
//   // const packingList = await generatePackingList(trip.destination, weather)  ← Gemini
//   // return <TripChecklist trip={trip} packingList={packingList} weatherForecast={weather} />
// }

export default function ChecklistPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">Checklist — scaffold in progress</p>
    </main>
  );
}

