// ============================================================
// PAGE: Live Travel Dashboard
// OWNER: Track A (Frontend & UX)
// ROUTE: /trip/[id]/live
// DESCRIPTION: Frames 9-12. The situational dashboard for
//   travel day. Renders LiveDashboard which composes all
//   live data hooks. UI theme shifts to dark "mission control."
//   The mascot provides proactive audio updates.
//
// FRAME 9:  Normal travel — gate, status, weather
// FRAME 10: Crisis detected — delay/cancellation alert
// FRAME 11: Exception request if rebooking is over budget
// FRAME 12: On-ground support after landing
// ============================================================

// TODO: "use client"
// TODO: import { LiveDashboard } from "@/components/travel/LiveDashboard"
// TODO: import { OnGroundSupport } from "@/components/travel/OnGroundSupport"
// TODO: import { useTrip } from "@/hooks/useTrip"
// TODO: import { useState } from "react"

// TODO: export default function LivePage({ params }: { params: { id: string } }) {
//   // const { trip } = useTrip(params.id)
//   // const [hasLanded, setHasLanded] = useState(false)
//   // if (hasLanded) return <OnGroundSupport trip={trip} policy={policy} />
//   // return <LiveDashboard trip={trip} />
// }

export default function LivePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">Live Dashboard — scaffold in progress</p>
    </main>
  );
}

