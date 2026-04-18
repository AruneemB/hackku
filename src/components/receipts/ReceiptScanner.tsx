// ============================================================
// COMPONENT: ReceiptScanner
// OWNER: Track A (Frontend & UX) + Track B (Gemini vision)
// FRAME: 13 — Multimodal Receipt Harvesting
// DESCRIPTION: Camera interface that captures a receipt photo
//   and sends it to /api/trips/[id]/receipts for Gemini
//   multimodal extraction. Shows extracted data for confirmation
//   before saving to the trip document.
//
// FLOW:
//   1. Open camera (<input type="file" accept="image/*" capture="environment">)
//   2. User photographs receipt
//   3. Convert to base64, POST to /api/trips/[id]/receipts
//   4. Show extracted data (merchant, amount, date) for review
//   5. User confirms → saved to MongoDB with Decimal128 total
//
// PROPS:
//   tripId: string
//   onReceiptAdded: (receipt: Receipt) => void
// ============================================================

// TODO: "use client"
// TODO: import { useState, useRef } from "react"
// TODO: import { useMascot } from "@/hooks/useMascot"
// TODO: import type { Receipt } from "@/types"

// TODO: export function ReceiptScanner({ tripId, onReceiptAdded }) {
//   // Camera capture input (mobile-friendly)
//   // Preview captured image
//   // Show loading state while Gemini processes
//   // Display extracted fields for user confirmation
//   // POST to API on confirm
// }
