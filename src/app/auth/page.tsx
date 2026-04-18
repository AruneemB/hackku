"use client"

// ============================================================
// PAGE: Auth Test (Standalone Sketch)
// ROUTE: /auth
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Independent test page for Step 5 (NextAuth +
//   Google OAuth). Demonstrates the full auth flow and confirms
//   Gmail scope is active before integration with the trip flow.
//
// SHOWS:
//   - Current session state (signed in / out)
//   - User name, email, avatar from Google profile
//   - Raw accessToken tail (last 8 chars, for debugging)
//   - Gmail connectivity test: last 5 inbox subjects
// ============================================================

import { useSession, signIn, signOut } from "next-auth/react"
import { useState } from "react"
import type { Session } from "next-auth"

interface GmailMessage {
  id: string
  subject: string
  from: string
  date: string
}

interface GmailTestResult {
  email?: string
  messages?: GmailMessage[]
  error?: string
}

interface SendResult {
  threadId?: string
  messageId?: string
  error?: string
}

export default function AuthTestPage() {
  const { data: session, status } = useSession()
  const [gmailResult, setGmailResult] = useState<GmailTestResult | null>(null)
  const [gmailLoading, setGmailLoading] = useState(false)
  const [sendTo, setSendTo] = useState("")
  const [sendSubject, setSendSubject] = useState("")
  const [sendBody, setSendBody] = useState("")
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [sendLoading, setSendLoading] = useState(false)

  async function sendEmail() {
    setSendLoading(true)
    setSendResult(null)
    try {
      const res = await fetch("/api/auth/gmail-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, subject: sendSubject, body: sendBody }),
      })
      setSendResult(await res.json())
    } catch (e) {
      setSendResult({ error: e instanceof Error ? e.message : "Fetch failed" })
    } finally {
      setSendLoading(false)
    }
  }

  async function testGmail() {
    setGmailLoading(true)
    setGmailResult(null)
    try {
      const res = await fetch("/api/auth/gmail-test")
      setGmailResult(await res.json())
    } catch (e) {
      setGmailResult({ error: e instanceof Error ? e.message : "Fetch failed" })
    } finally {
      setGmailLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold">Auth Test</h1>
          <p className="text-gray-500 text-xs mt-0.5">Step 5 · NextAuth + Google OAuth sketch</p>
        </div>

        {/* Session status */}
        <StatusBadge status={status} />

        {/* Signed out */}
        {status === "unauthenticated" && (
          <button
            onClick={() => signIn("google")}
            className="flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading session…
          </div>
        )}

        {/* Signed in */}
        {status === "authenticated" && session && (
          <>
            <UserCard session={session} />
            <TokenCard session={session} />

            <div className="flex flex-col gap-3">
              <button
                onClick={testGmail}
                disabled={gmailLoading}
                className="bg-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {gmailLoading ? "Fetching inbox…" : "Test Gmail Scope"}
              </button>
              {gmailResult && <GmailResult result={gmailResult} />}
            </div>

            {/* Send email */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Send Email</p>
              <input
                type="email"
                placeholder="To"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Subject"
                value={sendSubject}
                onChange={(e) => setSendSubject(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Body"
                rows={4}
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={sendEmail}
                disabled={sendLoading || !sendTo || !sendSubject || !sendBody}
                className="bg-green-700 font-semibold py-2.5 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {sendLoading ? "Sending…" : "Send"}
              </button>
              {sendResult && (
                sendResult.error
                  ? <p className="text-red-400 text-sm">{sendResult.error}</p>
                  : <p className="text-green-400 text-sm">Sent ✓ — thread: {sendResult.threadId}</p>
              )}
            </div>

            <button
              onClick={() => signOut()}
              className="text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors text-center"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    authenticated:   { label: "Signed in",  cls: "bg-green-900/60 text-green-300 border-green-800" },
    unauthenticated: { label: "Signed out", cls: "bg-gray-800 text-gray-400 border-gray-700" },
    loading:         { label: "Loading…",   cls: "bg-yellow-900/60 text-yellow-300 border-yellow-800" },
  }
  const { label, cls } = map[status] ?? map.loading
  return (
    <span className={`self-start text-xs font-medium px-3 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

function UserCard({ session }: { session: Session }) {
  const { user } = session
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
      {user?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ""} className="w-12 h-12 rounded-full" />
      )}
      <div>
        <p className="font-semibold">{user?.name ?? "—"}</p>
        <p className="text-sm text-gray-400">{user?.email ?? "—"}</p>
        <p className="text-xs text-gray-600 mt-0.5">id: {user?.id ?? "—"}</p>
      </div>
    </div>
  )
}

function TokenCard({ session }: { session: Session }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2 font-mono text-xs">
      <Row label="accessToken"  value={session.accessToken  ? `…${session.accessToken.slice(-8)}`  : "missing"} ok={!!session.accessToken} />
      <Row label="refreshToken" value={session.refreshToken ? `…${session.refreshToken.slice(-8)}` : "missing"} ok={!!session.refreshToken} />
    </div>
  )
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={ok ? "text-green-400" : "text-red-400"}>{value}</span>
    </div>
  )
}

function GmailResult({ result }: { result: GmailTestResult }) {
  if (result.error) {
    return (
      <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-xl">
        {result.error}
      </div>
    )
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Last 5 inbox messages</span>
        <span className="text-xs text-green-400">Gmail scope ✓</span>
      </div>
      {(result.messages ?? []).map((msg) => (
        <div key={msg.id} className="border-t border-gray-800 pt-3">
          <p className="text-sm font-medium truncate">{msg.subject || "(no subject)"}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{msg.from}</p>
          <p className="text-xs text-gray-600 mt-0.5">{msg.date}</p>
        </div>
      ))}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
