// Test: Slide 6 approval email — sends real Gmail without a browser session.
// Run from project root: node scripts/test-slide6-email.mjs
//
// One-time setup:
//   1. Start dev server and sign in at http://localhost:3000
//   2. Visit http://localhost:3000/api/debug/refresh-token
//   3. Copy the refreshToken value into .env.local as GOOGLE_REFRESH_TOKEN=<value>
//   4. node scripts/test-slide6-email.mjs

import { readFileSync } from "fs"

// ── Load .env.local ───────────────────────────────────────────
try {
  readFileSync(".env.local", "utf8").split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^['"]|['"]$/g, "").replace(/\r$/, "")
  })
} catch { /* file missing */ }

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN
const TO_EMAIL      = process.env.NEXT_PUBLIC_MANAGER_EMAIL || process.env.MANAGER_EMAIL || "mrmattiko@gmail.com"

// ── Pre-flight checks ─────────────────────────────────────────
console.log("=== Slide 6 Email Test ===\n")
console.log(`To               : ${TO_EMAIL}`)
console.log(`GOOGLE_CLIENT_ID : ${CLIENT_ID ? `...${CLIENT_ID.slice(-8)}` : "❌ NOT SET"}`)
console.log(`CLIENT_SECRET    : ${CLIENT_SECRET ? "✅ set" : "❌ NOT SET"}`)
console.log(`REFRESH_TOKEN    : ${REFRESH_TOKEN ? "✅ set" : "❌ NOT SET — see setup instructions above"}\n`)

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("❌ Missing credentials. Follow the one-time setup steps at the top of this file.")
  process.exit(1)
}

// ── Step 1: Exchange refresh token for access token ───────────
console.log("Step 1: Refreshing access token …")
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: "refresh_token",
  }),
})

const tokenData = await tokenRes.json()
if (!tokenRes.ok) {
  console.error(`❌ Token refresh failed (HTTP ${tokenRes.status}):`, JSON.stringify(tokenData, null, 2))
  if (tokenData.error === "invalid_grant") {
    console.error("\n  → The refresh token is expired or revoked.")
    console.error("  → Sign out, sign back in, revisit /api/debug/refresh-token, update GOOGLE_REFRESH_TOKEN.")
  }
  process.exit(1)
}

const accessToken = tokenData.access_token
console.log(`✅ Got access token (expires in ${tokenData.expires_in}s)\n`)

// ── Step 2: Build RFC 2822 email ──────────────────────────────
console.log("Step 2: Building email …")

const subject = "Travel Approval - Milan, Sep 14-19 [TEST]"
const body = [
  "Hi,",
  "",
  "I'm requesting approval for a business trip to Milan, Italy, Sep 14-19, 2025 for an on-site client meeting.",
  "",
  "Flight: LH 8904, OMA to MXP · $687 (nonstop)",
  "Hotel: Marriott Scala · $247/night x 5 = $1,235",
  "Note: Hotel is $47 over the $200 cap - closest preferred vendor to client office.",
  "",
  "Total estimated: $2,010. Please let me know if you have any questions.",
  "",
  "Thanks,",
  "Lockey",
  "",
  "[This is a programmatic test email from scripts/test-slide6-email.mjs]",
].join("\n")

const fromEmail = TO_EMAIL  // send from same account (we're using their own OAuth token)

function buildRfc2822(to, from, subject, body) {
  const msg = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join("\r\n")
  return Buffer.from(msg).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const raw = buildRfc2822(TO_EMAIL, fromEmail, subject, body)
console.log(`  From    : ${fromEmail}`)
console.log(`  To      : ${TO_EMAIL}`)
console.log(`  Subject : ${subject}`)
console.log(`  Body    : ${body.split("\n").length} lines\n`)

// ── Step 3: Send via Gmail API ────────────────────────────────
console.log("Step 3: Calling Gmail API …")
const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ raw }),
})

const sendData = await sendRes.json()
if (!sendRes.ok) {
  console.error(`❌ Gmail send failed (HTTP ${sendRes.status}):`)
  console.error(JSON.stringify(sendData, null, 2))
  if (sendData?.error?.status === "PERMISSION_DENIED") {
    console.error("\n  → The OAuth token lacks gmail.compose scope.")
    console.error("  → Sign out, sign back in (the app requests this scope on login), then re-run setup.")
  }
  process.exit(1)
}

console.log(`✅ Email sent successfully!`)
console.log(`  messageId : ${sendData.id}`)
console.log(`  threadId  : ${sendData.threadId}`)
console.log(`\nCheck ${TO_EMAIL} inbox for the test email.`)
