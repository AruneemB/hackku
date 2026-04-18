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

// TODO: import GoogleProvider from "next-auth/providers/google"

// TODO: export const googleProvider = GoogleProvider({
//   clientId: process.env.GOOGLE_CLIENT_ID!,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//   authorization: {
//     params: {
//       scope: [
//         "openid",
//         "email",
//         "profile",
//         "https://www.googleapis.com/auth/gmail.compose",
//         "https://www.googleapis.com/auth/gmail.readonly",
//       ].join(" "),
//       access_type: "offline",  // needed for refresh tokens
//       prompt: "consent",
//     }
//   }
// })

// TODO: export async function getAccessToken(session: Session): Promise<string> {
//   // Retrieves the stored access token from the NextAuth session
//   // Refreshes if expired using the stored refresh token
// }
