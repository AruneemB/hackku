// Quick test: POSTs testing_receipt.jpg to /api/receipt/scan
// Run from project root: node scripts/test-receipt-scan.mjs

import { readFileSync } from "fs"
import { resolve } from "path"

const imgPath = resolve("testing_receipt.jpg")
const b64 = readFileSync(imgPath).toString("base64")

console.log("Sending testing_receipt.jpg to /api/receipt/scan …\n")

const res = await fetch("http://localhost:3000/api/receipt/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageBase64: b64, mimeType: "image/jpeg" }),
})

const data = await res.json()

if (!res.ok) {
  console.error("❌ Scan failed:", data)
  process.exit(1)
}

console.log("✅ Extraction result:")
console.log(`  Merchant   : ${data.merchant}`)
console.log(`  Amount     : ${data.amount} ${data.currency}`)
console.log(`  USD Total  : $${data.totalUsd}`)
console.log(`  Date       : ${data.date}`)
console.log(`  Confidence : ${Math.round(data.confidence * 100)}%`)
console.log(`  Has PII    : ${data.hasPII}`)
