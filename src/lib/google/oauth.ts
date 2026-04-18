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
        token.accessToken = account.access_token!
        token.refreshToken = account.refresh_token!
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.user.id = token.id
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}

export async function getAccessToken(session: { accessToken: string }): Promise<string> {
  return session.accessToken
}
