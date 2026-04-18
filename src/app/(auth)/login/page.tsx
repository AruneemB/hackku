// ============================================================
// PAGE: Login
// OWNER: Track A (Frontend & UX)
// ROUTE: /login
// DESCRIPTION: Google OAuth sign-in page. On successful auth,
//   NextAuth redirects back to / where the trip form is shown.
//   The Gmail compose scope is requested here so Kelli only
//   needs to authorize once.
// ============================================================

// TODO: "use client"
// TODO: import { signIn } from "next-auth/react"

// TODO: export default function LoginPage() {
//   // return (
//   //   <main className="min-h-screen flex items-center justify-center">
//   //     <div className="text-center">
//   //       <h1>AI Travel Concierge</h1>
//   //       <button onClick={() => signIn("google", { callbackUrl: "/" })}>
//   //         Sign in with Google
//   //       </button>
//   //     </div>
//   //   </main>
//   // )
// }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-xl text-gray-500">Login — scaffold in progress</p>
    </main>
  );
}

