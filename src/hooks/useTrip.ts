// ============================================================
// HOOK: useTrip
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Manages trip document state. Fetches from
//   /api/trips/[id] and provides mutation helpers that call
//   the appropriate API routes. Uses optimistic updates so
//   the UI feels instant.
//
// USAGE:
//   const { trip, isLoading, updateStatus, addReceipt } = useTrip(tripId)
// ============================================================

// TODO: import { useState, useEffect } from "react"
// TODO: import type { Trip, TripBundle } from "@/types"

// TODO: export function useTrip(tripId: string) {
//   // const [trip, setTrip] = useState<Trip | null>(null)
//   // const [isLoading, setIsLoading] = useState(true)
//
//   // useEffect(() => { fetch(`/api/trips/${tripId}`).then(r => r.json()).then(setTrip) }, [tripId])
//
//   // const selectBundle = async (bundle: TripBundle) → PATCH /api/trips/[id] { selectedBundle }
//   // const updateStatus = async (status: TripStatus) → PATCH /api/trips/[id] { status }
//   // const addReceipt = async (receipt) → POST /api/trips/[id]/receipts
//
//   // return { trip, isLoading, selectBundle, updateStatus, addReceipt }
// }
