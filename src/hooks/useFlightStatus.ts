// ============================================================
// HOOK: useFlightStatus
// OWNER: Track A (Frontend & UX) + Track C (Data)
// DESCRIPTION: Polls /api/flights/live for the latest status
//   from the TimeSeries collection. Updates every 30 seconds.
//   If delay is detected, calls useMascot.say() with
//   the crisis message (Frame 10).
//
// USAGE:
//   const { status, isDelayed, delayMinutes } = useFlightStatus("AA2345")
// ============================================================

// TODO: import { useState, useEffect } from "react"
// TODO: import type { FlightStatusUpdate } from "@/types"

// TODO: export function useFlightStatus(flightNumber: string, intervalMs = 30000) {
//   // const [status, setStatus] = useState<FlightStatusUpdate | null>(null)
//
//   // useEffect(() => {
//   //   const poll = async () => {
//   //     const res = await fetch(`/api/flights/live?flightNumber=${flightNumber}`)
//   //     const data = await res.json()
//   //     setStatus(data)
//   //   }
//   //   poll()
//   //   const interval = setInterval(poll, intervalMs)
//   //   return () => clearInterval(interval)
//   // }, [flightNumber])
//
//   // return {
//   //   status,
//   //   isDelayed: status?.status === "delayed",
//   //   isCancelled: status?.status === "cancelled",
//   //   delayMinutes: status?.delayMinutes ?? 0,
//   //   gate: status?.gate
//   // }
// }
