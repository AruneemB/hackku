// ============================================================
// COMPONENT: PolicySummary
// OWNER: Track A (Frontend & UX)
// FRAME: 4 — Vector-Based Policy and Visa Verification
// DESCRIPTION: Displays the results of Atlas Vector Search +
//   visa lookup. Shows visa requirements, budget caps, and
//   any flags that require manager approval.
//   The mascot reads the summary aloud (empathetic or neutral).
//
// PROPS:
//   findings: PolicyFindings
//
// EXAMPLE DISPLAY:
//   🛂 VISA: No visa required for Italy (US citizen, 90-day Schengen)
//   ✈️ FLIGHT CAP: $1,500 (your selection: $1,240 ✅)
//   🏨 HOTEL CAP: $200/night (your selection: $215 ⚠️ needs approval)
//   🍽️ MEAL ALLOWANCE: $75/day
//   [Mascot says the summary in PolicyFindings.mascotSummary]
// ============================================================

// TODO: "use client"
// TODO: import type { PolicyFindings } from "@/types"
// TODO: import { useMascot } from "@/hooks/useMascot"

// TODO: export function PolicySummary({ findings }: { findings: PolicyFindings }) {
//   // useEffect → useMascot.say(findings.mascotSummary, "neutral")
//   // Render visa card, flight cap card, hotel cap card, meal card
//   // Flag cards that need approval in amber/red
// }
