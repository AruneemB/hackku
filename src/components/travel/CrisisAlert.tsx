// ============================================================
// COMPONENT: CrisisAlert
// OWNER: Track A (Frontend & UX)
// FRAME: 10-11 — Proactive Crisis Intervention + Exception Logic
// DESCRIPTION: Full-screen alert shown when a delay/cancellation
//   threatens Kelli's connection. The mascot interrupts with
//   an urgent ElevenLabs audio message BEFORE she lands.
//
//   Shows:
//   - Nature of the disruption (delay X min, cancelled)
//   - Alternative flight already found
//   - Hotel notified of late arrival (automated)
//   - If alternative is over budget: exception request drafted
//
// PROPS:
//   originalFlight: Flight
//   alternativeFlight: Flight | null
//   delayMinutes: number
//   isOverBudget: boolean
//   exceptionDraftText: string | null
// ============================================================

// TODO: "use client"
// TODO: import { useEffect } from "react"
// TODO: import { useMascot } from "@/hooks/useMascot"
// TODO: import type { Flight } from "@/types"

// TODO: export function CrisisAlert({ delayMinutes, alternativeFlight, isOverBudget, ... }) {
//   // useEffect → mascot.say("Kelli, I've detected a delay...", "urgent")
//   // If alternativeFlight available: show it with one-click confirm button
//   // If isOverBudget: show exception request with "Send to Manager" button
//   // If no alternative: show Frame 14 escalation (human contact info)
// }
