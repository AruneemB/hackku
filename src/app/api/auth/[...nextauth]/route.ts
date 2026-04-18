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

// TODO: import NextAuth from "next-auth"
// TODO: import { googleProvider } from "@/lib/google/oauth"

// TODO: const handler = NextAuth({
//   providers: [googleProvider],
//   callbacks: {
//     async jwt({ token, account }) {
//       // Store access_token + refresh_token in JWT on first sign-in
//       // if (account) { token.accessToken = account.access_token; token.refreshToken = account.refresh_token }
//       // return token
//     },
//     async session({ session, token }) {
//       // Expose accessToken to client session
//       // session.accessToken = token.accessToken as string
//       // return session
//     }
//   }
// })

// TODO: export { handler as GET, handler as POST }

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Auth route scaffold" });
}

export async function POST() {
  return NextResponse.json({ message: "Auth route scaffold" });
}

