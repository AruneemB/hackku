// ============================================================
// TYPES: Barrel export
// Re-export all types so teammates can import from "@/types"
// ============================================================

export type { User, Passport } from "./user";
export type {
  Trip,
  TripStatus,
  TripDestination,
  TripDates,
  TripBundle,
  ApprovalThread,
} from "./trip";
export type { Flight, FlightLeg, FlightStatusUpdate } from "./flight";
export type { Hotel, GeoPoint, HotelAmenity } from "./hotel";
export type { Policy, VisaRequirement, PolicyFindings } from "./policy";
export type { Receipt, GeminiReceiptExtraction } from "./receipt";
export type { WeatherForecast, DayForecast } from "./weather";
