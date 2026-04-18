// ============================================================
// LIB: Google OAuth Config
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Exports the NextAuth Google provider config and
//   helper to retrieve a fresh access token from the session.
//   The Gmail scope is requested here so Kelli can authorize
//   both login and email sending in a single OAuth flow.
//
// ENV REQUIRED:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
// ============================================================

import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

export const googleProvider = GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.readonly",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
    },
  },
})

// Exported so API routes can call getServerSession(authOptions)
export const authOptions: NextAuthOptions = {
  providers: [googleProvider],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token ?? undefined
        token.refreshToken = account.refresh_token ?? undefined
        token.id = user.id
        // expires_at is seconds since epoch; convert to ms
        token.accessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600_000
      }

      // Proactively refresh the token 5 min before expiry
      const expiresAt = token.accessTokenExpiresAt ?? 0
      if (Date.now() < expiresAt - 5 * 60_000) return token

      if (!token.refreshToken) return token

      try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
          }),
        })
        if (!res.ok) throw new Error(`Token refresh ${res.status}`)
        const refreshed = await res.json() as { access_token: string; expires_in: number }
        token.accessToken = refreshed.access_token
        token.accessTokenExpiresAt = Date.now() + refreshed.expires_in * 1000
      } catch {
        // Refresh failed — keep stale token; next request will hit 401 and re-auth
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      // refreshToken stays in JWT only — never exposed to the client
      session.user.id = token.id
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

export async function getAccessToken(session: { accessToken?: string }): Promise<string> {
  if (!session.accessToken) throw new Error("No access token in session")
  return session.accessToken
}
