// ============================================================
// UTIL: Date & Passport Helpers
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Passport expiry validation and travel date
//   helpers. The 6-month rule: passport must be valid for
//   at least 6 months AFTER the return date (many countries
//   enforce this, especially Schengen area).
//
//   Used in Frame 1 — mascot warns before search begins.
// ============================================================

// TODO: export function isPassportExpiringSoon(
//   passportExpiry: Date,
//   returnDate: Date,
//   bufferMonths = 6
// ): boolean {
//   // Returns true if passport expires within bufferMonths of returnDate
//   // EXAMPLE: expiry=2026-03-15, returnDate=2025-09-19, buffer=6
//   //   → months between return and expiry = 5.9 → TRUE (warn!)
// }

// TODO: export function monthsUntilExpiry(passportExpiry: Date, fromDate = new Date()): number {
//   // Returns fractional months remaining
// }

// TODO: export function formatTravelDate(date: Date): string {
//   // Returns human-readable string: "Sep 14, 2025"
// }

// TODO: export function buildDateWindow(centerDate: Date, windowDays: number): Date[] {
//   // Returns array of dates ± windowDays/2 from centerDate
//   // Used by fairGrid.ts
//   // EXAMPLE: buildDateWindow(Sep 14, 5) → [Sep 12, Sep 13, Sep 14, Sep 15, Sep 16]
// }
