// ============================================================
// API ROUTE: NextAuth Handler
// OWNER: Track C (Data & Integrations)
// ROUTE: /api/auth/[...nextauth]  (GET + POST)
// DESCRIPTION: Handles all NextAuth.js OAuth flows:
//   GET  /api/auth/signin     → redirect to Google
//   GET  /api/auth/callback   → handle OAuth callback
//   GET  /api/auth/session    → return current session
//   POST /api/auth/signout    → clear session
//
//   The Google provider is configured in lib/google/oauth.ts
//   with Gmail compose+readonly scopes so Kelli can authorize
//   travel email drafting in a single OAuth flow.
//
// ENV REQUIRED:
//   NEXTAUTH_SECRET, NEXTAUTH_URL,
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// ============================================================

import NextAuth from "next-auth"
import { authOptions } from "@/lib/google/oauth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
