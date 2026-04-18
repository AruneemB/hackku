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

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency = "USD"
): Promise<number> {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount
  const res = await fetch(
    `https://open.er-api.com/v6/latest/${fromCurrency.toUpperCase()}`
  )
  if (!res.ok) throw new Error(`Exchange rate fetch failed: ${res.status}`)
  const data = await res.json()
  const rate = data.rates?.[toCurrency.toUpperCase()]
  if (!rate) throw new Error(`No rate for ${fromCurrency} → ${toCurrency}`)
  return Math.round(amount * rate * 100) / 100
}
