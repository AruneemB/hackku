// ============================================================
// LIB: Gemini Multimodal (Receipt Vision)
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Handles Frame 13 — Kelli holds a paper receipt
//   to the camera and Gemini extracts the data. The image is
//   passed as a base64 inline part. PII sanitization runs
//   BEFORE saving to MongoDB (see lib/utils/pii.ts).
//
// USAGE (called from /api/trips/[id]/receipts):
//   const extraction = await extractReceiptData(base64Image, mimeType)
//   const clean = sanitizePII(extraction)
//   → save to trip.receipts[]
// ============================================================

// TODO: import { geminiModel } from "./client"
// TODO: import type { GeminiReceiptExtraction } from "@/types"

// TODO: export async function extractReceiptData(
//   base64Image: string,
//   mimeType: string   // e.g. "image/jpeg"
// ): Promise<GeminiReceiptExtraction> {
//
//   // Build the multimodal prompt:
//   // const prompt = `You are a receipt scanner. Extract from this image:
//   //   merchant name, total amount, currency, date.
//   //   Also flag if any credit card numbers or SSNs are visible (hasPII: true).
//   //   Return ONLY valid JSON in this shape:
//   //   { merchant, amount, currency, date, hasPII, confidence }`
//
//   // Pass the image as an inline part:
//   // const imagePart = { inlineData: { data: base64Image, mimeType } }
//   // const result = await geminiModel.generateContent([prompt, imagePart])
//   // return JSON.parse(result.response.text())
//
//   // EXAMPLE RETURN:
//   // {
//   //   "merchant": "Ristorante Da Enzo",
//   //   "amount": "43.50",
//   //   "currency": "EUR",
//   //   "date": "15/09/2025",
//   //   "hasPII": false,
//   //   "confidence": 0.97
//   // }
// }
