"use client"

// ============================================================
// COMPONENT: AuthProvider
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Thin client-component wrapper around NextAuth's
//   SessionProvider. Required because SessionProvider uses
//   React context, which cannot be used directly in Server
//   Components (like layout.tsx).
//   Import this in layout.tsx instead of SessionProvider.
// ============================================================

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
