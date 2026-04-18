// ============================================================
// TYPE: NextAuth Session + JWT Augmentation
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Extends next-auth's built-in Session and JWT
//   interfaces to carry the Google OAuth tokens needed for
//   Gmail API calls throughout the app.
//
//   accessToken         → passed to Gmail API for compose/read (optional — absent if login fails)
//   id                  → Google account subject ID (optional)
//   JWT.refreshToken    → kept in JWT only, never exposed to Session
//   JWT.accessTokenExpiresAt → epoch ms when token expires, used for auto-refresh
//
//   Import pattern: import type { Session } from "next-auth"
//   Session.accessToken is now typed without casting.
// ============================================================

import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: DefaultSession["user"] & {
      id?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    id?: string
    accessTokenExpiresAt?: number
  }
}
