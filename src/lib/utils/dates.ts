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

export function isPassportExpiringSoon(
  passportExpiry: Date,
  returnDate: Date,
  bufferMonths = 6
): boolean {
  return monthsUntilExpiry(passportExpiry, returnDate) < bufferMonths
}

export function monthsUntilExpiry(passportExpiry: Date, fromDate = new Date()): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44
  return (passportExpiry.getTime() - fromDate.getTime()) / msPerMonth
}

export function formatTravelDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function buildDateWindow(centerDate: Date, windowDays: number): Date[] {
  const half = Math.floor(windowDays / 2)
  return Array.from({ length: windowDays }, (_, i) => {
    const d = new Date(centerDate)
    d.setUTCDate(d.getUTCDate() - half + i)
    return d
  })
}
