import { describe, it, expect } from "vitest";
import {
  computeAirportToHotelDistance,
  getTransportMode,
} from "./OnGroundSupport";
import type { Trip } from "@/types/trip";

// Milan Malpensa (MXP): lat 45.6301, lng 8.7231
// Milan Linate (LIN):   lat 45.4451, lng 9.2767

function makeTrip(overrides: Partial<Trip["selectedBundle"]> & {
  destinationIata: string;
  hotelLat: number;
  hotelLng: number;
}): Trip {
  return {
    _id: "test",
    userId: "user1",
    status: "active",
    destination: { city: "Milan", country: "IT", officeLat: 45.4654, officeLng: 9.1866 },
    dates: { departure: new Date(), return: new Date() },
    flights: [],
    hotels: [],
    receipts: [],
    policyFindings: null,
    approvalThread: { gmailThreadId: null, status: null, reason: null },
    totalSpendUsd: "0",
    budgetCapUsd: "3000",
    createdAt: new Date(),
    updatedAt: new Date(),
    selectedBundle: {
      label: "A",
      description: "Test bundle",
      totalCostUsd: 2000,
      savingsVsStandard: 0,
      complianceFlags: [],
      flight: {
        id: "test_flight",
        outbound: {
          origin: "MCI",
          destination: overrides.destinationIata,
          departureTime: new Date(),
          arrivalTime: new Date(),
          carrier: "Test Air",
          flightNumber: "TA001",
          durationMinutes: 600,
        },
        inbound: {
          origin: overrides.destinationIata,
          destination: "MCI",
          departureTime: new Date(),
          arrivalTime: new Date(),
          carrier: "Test Air",
          flightNumber: "TA002",
          durationMinutes: 600,
        },
        priceUsd: 1200,
        saturdayNightStay: false,
        saturdayNightSavingsUsd: 0,
        originAirport: "MCI",
        distanceFromHomeAirportMiles: 0,
        source: "serpapi",
      },
      hotel: {
        id: "test_hotel",
        name: "Test Hotel Milan",
        location: {
          type: "Point",
          coordinates: [overrides.hotelLng, overrides.hotelLat],
        },
        address: "Via Test 1, Milan",
        distanceFromOfficeKm: 1,
        nightlyRateUsd: 180,
        amenities: { freeBreakfast: false, wifi: true, gym: false, parking: false },
        preferred: true,
        overPolicyCap: false,
        excessAboveCapUsd: 0,
        checkIn: new Date(),
        checkOut: new Date(),
        totalCostUsd: 900,
        source: "preferred_vendors_db",
      },
    },
  } as Trip;
}

describe("computeAirportToHotelDistance", () => {
  it("returns an error when no bundle is selected", () => {
    const trip = makeTrip({ destinationIata: "MXP", hotelLat: 45.46, hotelLng: 9.19 });
    trip.selectedBundle = null;
    const result = computeAirportToHotelDistance(trip);
    expect("error" in result).toBe(true);
    expect((result as { error: string }).error).toMatch(/No bundle selected/);
  });

  it("returns an error for an unknown airport IATA code", () => {
    const trip = makeTrip({ destinationIata: "ZZZ", hotelLat: 45.46, hotelLng: 9.19 });
    const result = computeAirportToHotelDistance(trip);
    expect("error" in result).toBe(true);
    expect((result as { error: string }).error).toMatch(/ZZZ/);
  });

  it("computes a plausible distance from MXP to a hotel near Milan city centre", () => {
    // Hotel near Milan city centre (~45.46, 9.19)
    // MXP is ~45km from city centre — expect roughly 40–55 km
    const trip = makeTrip({ destinationIata: "MXP", hotelLat: 45.4654, hotelLng: 9.1866 });
    const result = computeAirportToHotelDistance(trip);
    expect("error" in result).toBe(false);
    const { distanceKm } = result as { distanceKm: number };
    expect(distanceKm).toBeGreaterThan(35);
    expect(distanceKm).toBeLessThan(60);
  });

  it("computes a short distance from LIN to a hotel near Milan city centre", () => {
    // LIN (Linate) is ~7 km from city centre — expect roughly 5–12 km
    const trip = makeTrip({ destinationIata: "LIN", hotelLat: 45.4654, hotelLng: 9.1866 });
    const result = computeAirportToHotelDistance(trip);
    expect("error" in result).toBe(false);
    const { distanceKm } = result as { distanceKm: number };
    expect(distanceKm).toBeGreaterThan(4);
    expect(distanceKm).toBeLessThan(15);
  });

  it("returns the correct airport name", () => {
    const trip = makeTrip({ destinationIata: "MXP", hotelLat: 45.4654, hotelLng: 9.1866 });
    const result = computeAirportToHotelDistance(trip);
    expect("error" in result).toBe(false);
    expect((result as { airportName: string }).airportName).toBe("Milan Malpensa");
  });
});

describe("getTransportMode", () => {
  it("recommends walk/rideshare for < 3 km", () => {
    expect(getTransportMode(1).label).toBe("Walk / Rideshare");
    expect(getTransportMode(2.9).label).toBe("Walk / Rideshare");
  });

  it("recommends rideshare for 3–15 km", () => {
    expect(getTransportMode(3).label).toBe("Rideshare");
    expect(getTransportMode(10).label).toBe("Rideshare");
    expect(getTransportMode(14.9).label).toBe("Rideshare");
  });

  it("recommends company car for >= 15 km", () => {
    expect(getTransportMode(15).label).toBe("Company Car Recommended");
    expect(getTransportMode(50).label).toBe("Company Car Recommended");
  });
});
