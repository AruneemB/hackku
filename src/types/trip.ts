// ============================================================
// TYPE: Trip (Polymorphic Document)
// OWNER: Track B (AI & Intelligence) — most complex type
// DESCRIPTION: The central document in the app. Status field
//   drives the entire UI flow from draft → archived.
//   receipts.total is Decimal128 in MongoDB; use string here
//   to avoid float precision issues in JSON transport.
// ============================================================

import type { Flight } from "./flight";
import type { Hotel } from "./hotel";
import type { PolicyFindings } from "./policy";
import type { Receipt } from "./receipt";

export type TripStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "active"
  | "archived";

export interface TripDestination {
  city: string;
  country: string;       // ISO 3166-1 alpha-2
  officeLat: number;
  officeLng: number;
}

export interface TripDates {
  departure: Date;
  return: Date;
}

export interface ApprovalThread {
  gmailThreadId: string | null;
  status: "pending" | "approved" | "rejected" | null;
  reason: string | null;  // rejection reason from manager email
}

export interface TripBundle {
  label: "A" | "B" | "C";
  description: string;        // Gemini-generated explanation
  flight: Flight;
  hotel: Hotel;
  totalCostUsd: number;
  savingsVsStandard: number;  // 0 for bundle A
  complianceFlags: string[];  // e.g. ["hotel_over_cap"]
}

export interface Trip {
  _id: string;
  userId: string;
  status: TripStatus;
  destination: TripDestination;
  dates: TripDates;
  selectedBundle: TripBundle | null;
  flights: Flight[];           // raw search results before bundle selection
  hotels: Hotel[];             // raw search results before bundle selection
  receipts: Receipt[];
  policyFindings: PolicyFindings | null;
  approvalThread: ApprovalThread;
  totalSpendUsd: string;       // Decimal128 → string for safe transport
  budgetCapUsd: string;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------------------------
// EXAMPLE document (status: approved, bundle B selected):
// {
//   "_id": "665a2b3c4d5e6f7a8b9c0d1e",
//   "userId": "664f1a2b3c4d5e6f7a8b9c0d",
//   "status": "approved",
//   "destination": {
//     "city": "Milan", "country": "IT",
//     "officeLat": 45.4654, "officeLng": 9.1866
//   },
//   "dates": {
//     "departure": "2025-09-14T06:00:00.000Z",
//     "return": "2025-09-19T18:00:00.000Z"
//   },
//   "selectedBundle": {
//     "label": "B",
//     "description": "Fly via Bergamo (BGY), stay at NH Milano. Saves $500.",
//     "totalCostUsd": 1980,
//     "savingsVsStandard": 500,
//     "complianceFlags": []
//   },
//   "totalSpendUsd": "1980.00",
//   "budgetCapUsd": "2800.00"
// }
// -------------------------------------------------------
