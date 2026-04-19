// ============================================================
// API ROUTE: Debug — Capture Refresh Token
// ROUTE: GET /api/debug/refresh-token
// OWNER: Dev / testing only
// DESCRIPTION: Extracts the Google refresh token from the
//   current NextAuth JWT and writes it to .env.local as
//   GOOGLE_REFRESH_TOKEN so test scripts can run without a
//   browser session. Visit once while logged in; after that
//   node scripts/test-slide6-email.mjs works autonomously.
// ============================================================

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { authOptions } from "@/lib/google/oauth"

function upsertEnvLocal(key: string, value: string) {
  const envPath = resolve(process.cwd(), ".env.local")
  let contents = ""
  try { contents = readFileSync(envPath, "utf8") } catch { /* new file */ }

  const escaped = value.replace(/\n/g, "\\n")
  const lineRegex = new RegExp(`^${key}=.*$`, "m")
  if (lineRegex.test(contents)) {
    contents = contents.replace(lineRegex, `${key}=${escaped}`)
  } else {
    contents = contents.trimEnd() + `\n${key}=${escaped}\n`
  }
  writeFileSync(envPath, contents, "utf8")
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Not signed in — visit http://localhost:3000/login first" }, { status: 401 })
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return NextResponse.json({ error: "No JWT found" }, { status: 403 })
  }

  const refreshToken = (token as { refreshToken?: string }).refreshToken
  if (!refreshToken) {
    return NextResponse.json({
      error: "No refresh token in session.",
      hint: "Sign out and sign back in — the OAuth config uses access_type=offline+prompt=consent which always issues a refresh token.",
    }, { status: 404 })
  }

  upsertEnvLocal("GOOGLE_REFRESH_TOKEN", refreshToken)

  return NextResponse.json({
    ok: true,
    email: session.user?.email,
    message: "GOOGLE_REFRESH_TOKEN written to .env.local — you can now run: node scripts/test-slide6-email.mjs",
  })
}
