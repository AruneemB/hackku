// Directly tests the Gemini model without going through Next.js
// Run from project root: node scripts/test-gemini-direct.mjs

import { readFileSync } from "fs"
import { resolve } from "path"
import { readFileSync as readEnv } from "fs"

// Parse .env.local manually — dotenv not guaranteed to be installed
try {
  readEnv(".env.local", "utf8").split("\n").forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^['"]|['"]$/g, "")
  })
} catch { /* file missing */ }

const { GoogleGenerativeAI } = await import("@google/generative-ai")

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) { console.error("❌ GEMINI_API_KEY not set in .env.local"); process.exit(1) }

const MODEL = "gemini-2.5-flash"
console.log(`Using model: ${MODEL}`)
console.log(`API key ends in: ...${apiKey.slice(-6)}\n`)

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: MODEL })

const imgPath = resolve("testing_receipt.jpg")
const b64 = readFileSync(imgPath).toString("base64")

console.log("Sending image to Gemini…")
try {
  const result = await model.generateContent([
    `Return ONLY a JSON object: {"merchant":string,"amount":string,"currency":string,"date":string,"hasPII":boolean,"confidence":number}`,
    { inlineData: { data: b64, mimeType: "image/jpeg" } }
  ])
  console.log("✅ Raw response:", result.response.text())
} catch (err) {
  console.error("❌ Gemini error:", err.message ?? err)
}
