// ============================================================
// TYPE: Policy & PolicyFindings
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Policy is the per-city budget rule stored in
//   MongoDB. PolicyFindings is what Gemini returns after
//   running Atlas Vector Search against the travel handbook
//   + visa lookup. This is displayed in Frame 4.
// ============================================================

export interface Policy {
  _id: string;
  cityCode: string;   // IATA city code, e.g. "MIL"
  country: string;    // ISO 3166-1 alpha-2
  hotelNightlyCapUsd: number;
  flightCapUsd: number;
  mealAllowancePerDayUsd: number;
  preferredTransport: string[];
  requiresApprovalAboveUsd: number;
  handbookExcerpt: string; // source text used for vector embedding
  // embedding: number[];  ← stored in DB but not returned to client
}

export interface VisaRequirement {
  destinationCountry: string;
  citizenship: string;
  visaRequired: boolean;
  visaType: string | null;     // e.g. "Type-C Schengen"
  stayLimitDays: number;
  notes: string;
  applicationUrl: string | null;
}

export interface PolicyFindings {
  visa: VisaRequirement;
  hotelNightlyCapUsd: number;
  flightCapUsd: number;
  mealAllowancePerDayUsd: number;
  requiresManagerApproval: boolean;
  approvalReason: string | null;  // e.g. "hotel exceeds $200 cap"
  mascotSummary: string;          // Gemini-written plain-language summary
}

// -------------------------------------------------------
// EXAMPLE PolicyFindings for Milan trip (hotel over cap):
// {
//   "visa": {
//     "destinationCountry": "IT",
//     "citizenship": "US",
//     "visaRequired": false,
//     "stayLimitDays": 90,
//     "notes": "No visa required — Schengen 90-day rule applies."
//   },
//   "hotelNightlyCapUsd": 200,
//   "flightCapUsd": 1500,
//   "mealAllowancePerDayUsd": 75,
//   "requiresManagerApproval": true,
//   "approvalReason": "Selected hotel ($215/night) exceeds the $200 Milan cap.",
//   "mascotSummary": "Good news — no visa needed for Italy! However, the hotel
//     is $15 over the nightly cap, so I'll need a quick sign-off from your manager."
// }
// -------------------------------------------------------
