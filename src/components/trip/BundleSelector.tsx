// ============================================================
// COMPONENT: BundleSelector
// OWNER: Track A (Frontend & UX)
// FRAME: 5 — Tradeoff Presentation and Choice
// DESCRIPTION: Renders three BundleCard components side-by-side.
//   Manages selection state and calls /api/trips/[id] PATCH
//   when Lockey selects a bundle. Triggers mascot to explain
//   the selected bundle's tradeoffs via useMascot.say().
//
// PROPS:
//   tripId: string
//   bundles: TripBundle[]   (exactly 3, labeled A/B/C)
//   onBundleSelected: (bundle: TripBundle) => void
// ============================================================

// TODO: "use client"
// TODO: import { useState } from "react"
// TODO: import { BundleCard } from "./BundleCard"
// TODO: import { useMascot } from "@/hooks/useMascot"
// TODO: import type { TripBundle } from "@/types"

// TODO: export function BundleSelector({ tripId, bundles, onBundleSelected }) {
//   // const [selected, setSelected] = useState<TripBundle | null>(null)
//   // On select: PATCH /api/trips/[id] + say(bundle.description, "excited")
//   // Show "Proceed to Approval" button once a bundle is selected
// }
