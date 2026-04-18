// ============================================================
// TYPE: Receipt
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Extracted by Gemini multimodal vision (Frame 13).
//   total is stored as Decimal128 in MongoDB for precision;
//   transported as string in JSON. PII (card numbers) is
//   stripped by lib/utils/pii.ts before storage.
// ============================================================

export interface Receipt {
  id: string;
  tripId: string;
  merchant: string;
  category: "meal" | "transport" | "hotel" | "other";
  totalUsd: string;         // Decimal128 serialized to string
  currency: string;         // original currency ISO code, e.g. "EUR"
  originalAmount: string;   // amount in original currency
  date: Date;
  sanitized: boolean;       // true = PII stripped by pii.ts
  imageUrl: string | null;  // optional stored receipt photo
  extractedByAI: boolean;
  createdAt: Date;
}

// -------------------------------------------------------
// EXAMPLE receipt after Gemini multimodal extraction:
// {
//   "id": "rcpt_664f1a2b_001",
//   "tripId": "665a2b3c4d5e6f7a8b9c0d1e",
//   "merchant": "Ristorante Da Enzo",
//   "category": "meal",
//   "totalUsd": "47.23",
//   "currency": "EUR",
//   "originalAmount": "43.50",
//   "date": "2025-09-15T20:30:00.000Z",
//   "sanitized": true,
//   "imageUrl": null,
//   "extractedByAI": true,
//   "createdAt": "2025-09-15T21:00:00.000Z"
// }
// -------------------------------------------------------

// What Gemini vision returns before we store it
export interface GeminiReceiptExtraction {
  merchant: string;
  amount: string;
  currency: string;
  date: string;        // raw string from image, normalized later
  category: "meal" | "transport" | "hotel" | "other";
  hasPII: boolean;     // true if card/SSN detected
  confidence: number;  // 0-1
}
