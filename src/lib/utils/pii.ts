// ============================================================
// UTIL: PII Sanitization
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Strips sensitive personal data from Gemini's
//   receipt extraction before it is saved to MongoDB.
//   Handles credit card numbers, CVVs, and SSNs that appear
//   on receipts.
//
//   Privacy by Design — Frame 16 references this explicitly.
//   Called in /api/trips/[id]/receipts BEFORE writing to DB.
// ============================================================

import type { GeminiReceiptExtraction } from "@/types"

// Matches 13–19 contiguous digits with optional single space/dash separators
const CARD_NUMBER_REGEX = /\b(?:\d[ -]?){12,18}\d\b/g
// Matches CVV/CVC/security code labels followed by 3–4 digits
const CVV_REGEX = /\b(?:cvv2?|cvc2?|security[ -]?code)\s*:?\s*\d{3,4}\b/gi
// Matches formatted SSN (xxx-xx-xxxx) and unformatted 9-digit SSN
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b|\b(?!000|666|9\d\d)\d{3}(?!00)\d{2}(?!0000)\d{4}\b/g

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
    hasPII: raw.hasPII,
  }
}
