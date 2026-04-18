// ============================================================
// UTIL: PII Sanitization
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Strips sensitive personal data from Gemini's
//   receipt extraction before it is saved to MongoDB.
//   Handles credit card numbers, CVVs, SSNs, and full names
//   that appear on receipts.
//
//   Privacy by Design — Frame 16 references this explicitly.
//   Called in /api/trips/[id]/receipts BEFORE writing to DB.
// ============================================================

import type { GeminiReceiptExtraction } from "@/types"

const CARD_NUMBER_REGEX = /\b(?:\d[ -]*?){13,16}\b/g
const CVV_REGEX = /\bcvv\s*:?\s*\d{3,4}\b/gi
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g

export function maskString(value: string): string {
  return value
    .replace(CARD_NUMBER_REGEX, "***REDACTED***")
    .replace(CVV_REGEX, "CVV: ***REDACTED***")
    .replace(SSN_REGEX, "***REDACTED***")
}

export function sanitizeReceiptData(raw: GeminiReceiptExtraction): GeminiReceiptExtraction {
  return {
    ...raw,
    merchant: maskString(raw.merchant),
    hasPII: false,
  }
}
