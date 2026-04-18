// ============================================================
// PAGE: Trip Hub / Redirect
// OWNER: Track A (Frontend & UX)
// ROUTE: /trip/[id]
// DESCRIPTION: Fetches the trip from MongoDB and redirects to
//   the appropriate sub-page based on trip status:
//
//   draft            → /trip/[id]/planning
//   pending_approval → /trip/[id]/approval
//   approved         → /trip/[id]/checklist
//   active           → /trip/[id]/live
//   archived         → /trip/[id]/post-trip
//   rejected         → /trip/[id]/approval (shows rejection recovery)
// ============================================================

// TODO: import { redirect } from "next/navigation"

// TODO: export default async function TripHubPage({ params }: { params: { id: string } }) {
//   // const trip = await fetch(`/api/trips/${params.id}`).then(r => r.json())
//   // Redirect based on trip.status
//   // const ROUTES = {
//   //   draft: "planning", pending_approval: "approval", rejected: "approval",
//   //   approved: "checklist", active: "live", archived: "post-trip"
//   // }
//   // redirect(`/trip/${params.id}/${ROUTES[trip.status]}`)
// }
