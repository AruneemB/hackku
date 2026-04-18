// ============================================================
// HOOK: useLiveTracking
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Combines flight status, weather, and hotel
//   check-in data into a single live dashboard state for
//   Frame 9. Orchestrates the mascot's proactive audio
//   updates (gate announcements, traffic warnings).
//
// USAGE:
//   const { flightStatus, weather, hotelStatus, mascotAlerts }
//     = useLiveTracking(trip)
// ============================================================

// TODO: import { useFlightStatus } from "./useFlightStatus"
// TODO: import { useMascot } from "./useMascot"
// TODO: import type { Trip, WeatherForecast } from "@/types"

// TODO: export function useLiveTracking(trip: Trip | null) {
//   // Compose useFlightStatus for the active leg
//   // Fetch weather for destination
//   // Watch for delays → trigger mascot empathetic alert
//   // Watch for gate changes → trigger mascot neutral update
//
//   // return {
//   //   flightStatus,   ← from useFlightStatus
//   //   weather,        ← from /api/weather fetch
//   //   mascotAlerts,   ← array of recent mascot messages
//   //   isInCrisis,     ← true if delay > connection buffer
//   // }
// }
