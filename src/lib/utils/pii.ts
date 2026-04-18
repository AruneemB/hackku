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

// TODO: export function sanitizeReceiptData(raw: GeminiReceiptExtraction): GeminiReceiptExtraction {
//   // Strip credit card numbers (regex: 4+ digit groups)
//   // Strip CVV patterns
//   // Strip SSN patterns
//   // Return sanitized copy with hasPII: false
// }

// TODO: const CARD_NUMBER_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
// TODO: const CVV_REGEX = /\b\d{3,4}\b/g;
// TODO: const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

// TODO: export function maskString(value: string): string {
//   // Replaces detected PII with "***REDACTED***"
// }
