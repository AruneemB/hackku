// ============================================================
// UTIL: Currency / Decimal128 Helpers
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: MongoDB Decimal128 is used for all monetary
//   values to avoid floating-point precision errors (e.g.
//   47.10 + 12.90 = 59.99999 in float64).
//
//   Decimal128 values are serialized as strings in JSON
//   transport. These helpers convert between number, string,
//   and Decimal128 safely.
// ============================================================

import { Decimal128 } from "mongodb"

export function toDecimal128(value: number | string): Decimal128 {
  return Decimal128.fromString(Number(value).toFixed(2))
}

export function fromDecimal128(value: Decimal128 | undefined): string {
  return value?.toString() ?? "0.00"
}

// ---------------------------------------------------------------------------
// In-memory exchange rate cache — rates are fetched once per currency per day
// ---------------------------------------------------------------------------

interface CacheEntry {
  rates: Record<string, number>
  expiresAt: number
}

const rateCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const FETCH_TIMEOUT_MS = 3000

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency = "USD"
): Promise<number> {
  const from = fromCurrency.toUpperCase()
  const to   = toCurrency.toUpperCase()
  if (from === to) return amount

  const cached = rateCache.get(from)
  if (cached && Date.now() < cached.expiresAt) {
    const rate = cached.rates[to]
    if (rate) return Math.round(amount * rate * 100) / 100
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(
      `https://open.er-api.com/v6/latest/${from}`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timer))

    if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`)

    const data = await res.json()
    rateCache.set(from, { rates: data.rates ?? {}, expiresAt: Date.now() + CACHE_TTL_MS })

    const rate = data.rates?.[to]
    if (rate) return Math.round(amount * rate * 100) / 100
  } catch {
    // Network error or timeout — return original amount unchanged
  }

  return amount
}
