// ============================================================
// PAGE: Landing / Home (Frame 1)
// OWNER: Track A (Frontend & UX)
// ROUTE: /
// DESCRIPTION: The first page Kelli sees. If she is not logged
//   in, redirects to /login. If logged in, renders the Mascot
//   greeting and TripInitForm. The mascot greets her by name
//   via ElevenLabs as soon as the page loads.
//
// FLOW:
//   Not authenticated → /login (Google OAuth)
//   Authenticated     → Mascot says "Hi [name]! Where are we headed?"
//                    → TripInitForm renders below mascot
// ============================================================

// TODO: import { getServerSession } from "next-auth"
// TODO: import { redirect } from "next/navigation"
// TODO: import { TripInitForm } from "@/components/trip/TripInitForm"

// TODO: export default async function HomePage() {
//   // const session = await getServerSession()
//   // if (!session) redirect("/login")
//   // return (
//   //   <main className="min-h-screen flex flex-col items-center justify-center p-8">
//   //     <h1 className="text-3xl font-bold mb-8">Welcome, {session.user?.name}</h1>
//   //     <TripInitForm />
//   //   </main>
//   // )
// }

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">AI Travel Concierge — scaffold in progress</p>
    </main>
  );
}
