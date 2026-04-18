// ============================================================
// API ROUTE: Receipt Capture (Frame 13)
// OWNER: Track B (AI & Intelligence)
// ROUTE: POST /api/trips/[id]/receipts
// DESCRIPTION: Receives a base64 image from ReceiptScanner,
//   runs Gemini multimodal extraction, sanitizes PII, converts
//   amount to Decimal128, and appends to trip.receipts[].
//
// REQUEST BODY:
// {
//   "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
//   "mimeType": "image/jpeg"
// }
//
// RESPONSE (201):
// {
//   "receipt": {
//     "id": "rcpt_001",
//     "merchant": "Ristorante Da Enzo",
//     "category": "meal",
//     "totalUsd": "47.23",
//     "currency": "EUR",
//     "originalAmount": "43.50",
//     "date": "2025-09-15T20:30:00.000Z",
//     "sanitized": true,
//     "extractedByAI": true
//   }
// }
// ============================================================

// TODO: import { NextRequest, NextResponse } from "next/server"
// TODO: import { extractReceiptData } from "@/lib/gemini/multimodal"
// TODO: import { sanitizeReceiptData } from "@/lib/utils/pii"
// TODO: import { toDecimal128, convertCurrency } from "@/lib/utils/currency"

// TODO: export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   // 1. Parse imageBase64 + mimeType from body
//   // 2. extractReceiptData(base64, mimeType) via Gemini
//   // 3. sanitizeReceiptData(extraction) — strip PII
//   // 4. convertCurrency(amount, currency, "USD")
//   // 5. toDecimal128(usdAmount)
//   // 6. Append to trip.receipts[] and update trip.totalSpend
//   // 7. Return receipt doc
// }
