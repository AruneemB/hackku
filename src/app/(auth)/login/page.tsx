// ============================================================
// PAGE: Login
// OWNER: Track A (Frontend & UX)
// ROUTE: /login
// DESCRIPTION: Google OAuth sign-in page. On successful auth,
//   NextAuth redirects back to / where the trip form is shown.
//   The Gmail compose scope is requested here so Lockey only
//   needs to authorize once.
// ============================================================

"use client"

import { signIn } from "next-auth/react"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lockey</h1>
          <p className="text-gray-400 text-sm mt-1">AI Travel Concierge · Lockton</p>
        </div>
        <button
          onClick={() => signIn("google", { callbackUrl: "/demo" })}
          className="flex items-center gap-3 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
        <p className="text-xs text-gray-600">
          Authorizes Gmail access for travel approvals and receipt scanning.
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}
