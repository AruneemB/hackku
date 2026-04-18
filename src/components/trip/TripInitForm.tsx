// ============================================================
// COMPONENT: TripInitForm
// OWNER: Track A (Frontend & UX)
// FRAME: 1 — Identity and Intent Initialization
// DESCRIPTION: The first form Kelli sees. She enters:
//   - Destination city/country (dropdown of 6 demo countries)
//   - Departure date
//   - Return date
//   On submit, the form calls POST /api/trips to create a draft
//   trip document, then redirects to /trip/[id]/planning.
//   Mascot greets her BEFORE the form and warns about passport
//   expiry AFTER form submission if applicable.
//
// VALIDATION:
//   - Departure must be at least 3 days from today
//   - Return must be after departure
//   - Country must be one of: IT, GB, FR, JP, CA, MX
// ============================================================

// TODO: "use client"
// TODO: import { useState } from "react"
// TODO: import { useRouter } from "next/navigation"
// TODO: import { useMascot } from "@/hooks/useMascot"

// TODO: const DEMO_DESTINATIONS = [
//   { label: "Milan, Italy", city: "Milan", country: "IT" },
//   { label: "London, UK", city: "London", country: "GB" },
//   { label: "Paris, France", city: "Paris", country: "FR" },
//   { label: "Tokyo, Japan", city: "Tokyo", country: "JP" },
//   { label: "Toronto, Canada", city: "Toronto", country: "CA" },
//   { label: "Mexico City, Mexico", city: "Mexico City", country: "MX" },
// ]

// TODO: export function TripInitForm() {
//   // 1. Render destination dropdown + date pickers
//   // 2. On submit: POST /api/trips
//   // 3. Check passport expiry (GET /api/users/me) → mascot warn
//   // 4. Redirect to /trip/[newTripId]/planning
// }
