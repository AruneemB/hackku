// ============================================================
// TYPE: NextAuth Session + JWT Augmentation
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Extends next-auth's built-in Session and JWT
//   interfaces to carry the Google OAuth tokens needed for
//   Gmail API calls throughout the app.
//
//   accessToken  → passed to Gmail API for compose/read
//   refreshToken → used to obtain a new accessToken when expired
//   id           → Google account subject ID
//
//   Import pattern: import type { Session } from "next-auth"
//   Session.accessToken is now typed without casting.
// ============================================================

import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken: string
    refreshToken: string
    user: DefaultSession["user"] & {
      id: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string
    refreshToken: string
    id: string
  }
}
