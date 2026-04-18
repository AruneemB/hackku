# Lockton Companies — Employee Travel Handbook

> This document is the source of truth for all corporate travel policy.
> It is embedded into the MongoDB `policies` collection via Gemini text-embedding-004
> and queried via Atlas Vector Search in Frame 4 of the travel assistant.
> Run `scripts/seed-mongodb.ts` to embed and seed all city policies.

---

## General Policy

All business travel must be pre-approved by the traveler's direct manager.
Travel that exceeds any budget cap listed below automatically requires
manager approval before booking can be confirmed.

Employees should book travel at least 14 days in advance where possible
to qualify for advance-purchase airfare discounts.

---

## Flight Policy

- Economy class is required for all flights under 6 hours.
- Business class may be requested for flights over 8 hours with VP approval.
- Travelers should use the Fair Grid search to identify the lowest-cost
  options within a 5-day flexibility window around the target dates.
- Airports within 100 miles of the traveler's home airport are eligible
  for the search to maximize cost savings.

### Flight Budget Caps by Destination

| City          | Country | Max Airfare (USD) |
|---------------|---------|-------------------|
| Milan         | IT      | $1,500            |
| London        | GB      | $1,200            |
| Paris         | FR      | $1,200            |
| Tokyo         | JP      | $2,200            |
| Toronto       | CA      | $800              |
| Mexico City   | MX      | $600              |

---

## Hotel Policy

All hotels must be booked from the company's Preferred Vendor list where available.
Preferred vendors have been pre-negotiated for rate and quality.

If no preferred vendor is available within 5 km of the client site,
the traveler may book an alternative hotel subject to the nightly rate cap.

Breakfast, wifi, and in-room movies are covered at preferred vendors.
Personal charges (mini-bar, spa, room service beyond meals) are not covered.

### Hotel Nightly Rate Caps by City

| City          | Country | Max Nightly Rate (USD) | Requires Approval Above |
|---------------|---------|------------------------|-------------------------|
| Milan         | IT      | $200                   | $200                    |
| London        | GB      | $250                   | $250                    |
| Paris         | FR      | $220                   | $220                    |
| Tokyo         | JP      | $180                   | $180                    |
| Toronto       | CA      | $175                   | $175                    |
| Mexico City   | MX      | $140                   | $140                    |

---

## Meal Allowance

| City          | Daily Allowance (USD) |
|---------------|-----------------------|
| Milan         | $75                   |
| London        | $85                   |
| Paris         | $80                   |
| Tokyo         | $70                   |
| Toronto       | $65                   |
| Mexico City   | $50                   |

Receipts are required for all meal expenses over $25.
Team dinners require prior approval and must not exceed 3x the individual daily rate.

---

## Ground Transportation

- Company-arranged car service is the preferred transport from airport to hotel.
- Rideshare (Uber/Lyft) is approved as an alternative.
- Personal rental cars require VP approval.
- Public transit is always encouraged where available and practical.

---

## Preferred Transport by City

| City        | Preferred Options                   |
|-------------|-------------------------------------|
| Milan       | Company car, rideshare, metro       |
| London      | Black cab, rideshare, Heathrow Express |
| Paris       | Rideshare, RER B (CDG), metro       |
| Tokyo       | Narita Express, Limousine Bus       |
| Toronto     | Union Pearson Express, rideshare    |
| Mexico City | Company car, approved rideshare     |

---

## Approval Requirements

1. Any booking that exceeds a budget cap requires manager sign-off via email.
2. The travel assistant will automatically draft and send the approval request.
3. The manager's reply is detected automatically and updates the booking status.
4. If a booking is rejected, the traveler must select a compliant alternative.

---

## Saturday Night Stay Rule

Flights that include a Saturday night stay are often significantly cheaper
(up to 30% savings). The travel assistant will automatically calculate
the price delta and include it in the bundle tradeoff analysis.

---

## Expense Reporting

- All receipts must be submitted within 30 days of return.
- Receipts can be photographed using the AI travel assistant's receipt scanner.
- The assistant will automatically extract merchant, amount, and date.
- All financial data is stored with Decimal128 precision to avoid rounding errors.
- Sensitive data (credit card numbers) is automatically redacted before storage.

---

## Data Privacy

- Location tracking is only active during documented travel hours.
- OAuth tokens are encrypted at rest in MongoDB Atlas.
- Receipt images are processed by AI and the raw image is not stored.
- All data is deleted or anonymized within 90 days of trip archiving.
