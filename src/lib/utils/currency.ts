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

// TODO: import { Decimal128 } from "mongodb"

// TODO: export function toDecimal128(value: number | string): Decimal128 {
//   // Converts number or string to MongoDB Decimal128
//   // return Decimal128.fromString(String(value))
// }

// TODO: export function fromDecimal128(value: Decimal128 | undefined): string {
//   // Serializes Decimal128 to string for JSON
//   // return value?.toString() ?? "0.00"
// }

// TODO: export function convertCurrency(
//   amount: number,
//   fromCurrency: string,
//   toCurrency: string
// ): Promise<number> {
//   // Convert receipt amount to USD for storage
//   // Use a free exchange rate API (e.g. open.er-api.com)
//   // EXAMPLE: convertCurrency(43.50, "EUR", "USD") → 47.23
// }
