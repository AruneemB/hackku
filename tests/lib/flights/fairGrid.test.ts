import { describe, it, expect, vi, beforeEach } from "vitest";
import { runFairGrid, buildDateWindow } from "@/lib/flights/fairGrid";
import { searchFlights } from "@/lib/flights/search";
import { getAirportsWithinRadius } from "@/lib/flights/airports";

// Mock dependencies
vi.mock("@/lib/flights/search", () => ({
  searchFlights: vi.fn(),
}));

vi.mock("@/lib/flights/airports", () => ({
  getAirportsWithinRadius: vi.fn(),
}));

describe("fairGrid", () => {
  describe("buildDateWindow", () => {
    it("should return correct window centered on target", () => {
      // Use a date that won't shift day due to TZ (Noon UTC)
      const target = new Date("2025-09-14T12:00:00Z");
      const window = buildDateWindow(target, 5);
      expect(window).toEqual([
        "2025-09-12",
        "2025-09-13",
        "2025-09-14",
        "2025-09-15",
        "2025-09-16",
      ]);
    });

    it("should handle window size 3", () => {
      const target = new Date("2025-09-14T12:00:00Z");
      const window = buildDateWindow(target, 3);
      expect(window).toEqual([
        "2025-09-13",
        "2025-09-14",
        "2025-09-15",
      ]);
    });
  });

  describe("runFairGrid", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should process expanded airports and date windows correctly", async () => {
      // Mock 2 airports
      (getAirportsWithinRadius as any).mockReturnValue([
        { code: "MCI", distanceMiles: 0 },
        { code: "MKC", distanceMiles: 5 },
      ]);

      // Mock searchFlights to return 1 flight per call
      (searchFlights as any).mockImplementation(({ origin, date }: { origin: string; date: string }) => {
        const price = origin === "MCI" ? 1000 : 1100;
        return Promise.resolve([{
          id: `flight_${origin}_${date}`,
          priceUsd: price,
          saturdayNightStay: false,
          saturdayNightSavingsUsd: 0,
          originAirport: origin
        }]);
      });

      const params = {
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: new Date("2025-09-14T12:00:00Z"),
        targetReturn: new Date("2025-09-19T12:00:00Z"),
        windowDays: 3,
        radiusMiles: 50,
      };

      const results = await runFairGrid(params);

      // 2 airports * 3 dates = 6 searches
      expect(searchFlights).toHaveBeenCalledTimes(6);
      expect(results).toHaveLength(6);
      
      // Sorted by price: MCI flights (1000) then MKC flights (1100)
      expect(results[0].priceUsd).toBe(1000);
      expect(results[0].originAirport).toBe("MCI");
      expect(results[0].distanceFromHomeAirportMiles).toBe(0);
      
      expect(results[5].priceUsd).toBe(1100);
      expect(results[5].originAirport).toBe("MKC");
      expect(results[5].distanceFromHomeAirportMiles).toBe(5);
    });

    it("should calculate saturdayNightStay and savings correctly", async () => {
      (getAirportsWithinRadius as any).mockReturnValue([
        { code: "MCI", distanceMiles: 0 },
      ]);

      // targetDeparture: 2025-09-14 (Sunday)
      // targetReturn: 2025-09-19 (Friday)
      // windowDays: 3 -> [2025-09-13 (Sat), 2025-09-14 (Sun), 2025-09-15 (Mon)]
      // durations: targetReturn - targetDeparture = 5 days
      // return dates:
      //   2025-09-13 (Sat) -> 2025-09-18 (Thursday). Dep Sat, Ret Thu -> Includes Sat Night Stay.
      //   2025-09-14 (Sun) -> 2025-09-19 (Friday). Dep Sun, Ret Fri -> No Sat Night.
      //   2025-09-15 (Mon) -> 2025-09-20 (Saturday). Dep Mon, Ret Sat -> No Sat Night.

      (searchFlights as any).mockImplementation(({ date, returnDate }: { date: string; returnDate: string }) => {
        // Return 2025-09-18 (Thursday) is cheaper (Saturday night stay)
        const price = returnDate === "2025-09-18" ? 800 : 1000;
        return Promise.resolve([{
          id: `flight_${date}`,
          priceUsd: price,
          originAirport: "MCI"
        }]);
      });

      const params = {
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: new Date("2025-09-14T12:00:00Z"),
        targetReturn: new Date("2025-09-19T12:00:00Z"),
        windowDays: 3,
      };

      const results = await runFairGrid(params);

      // The result departing on 2025-09-13 and returning on 2025-09-18 should have saturdayNightStay: true
      const satFlight = results.find(f => f.priceUsd === 800);
      expect(satFlight?.saturdayNightStay).toBe(true);
      
      // Cheapest non-sat was 1000. Sat was 800. Savings = 200.
      expect(satFlight?.saturdayNightSavingsUsd).toBe(200);

      const nonSatFlight = results.find(f => f.priceUsd === 1000);
      expect(nonSatFlight?.saturdayNightStay).toBe(false);
      expect(nonSatFlight?.saturdayNightSavingsUsd).toBe(0);
    });

    it("should deduplicate flights by ID keeping the lowest price", async () => {
      (getAirportsWithinRadius as any).mockReturnValue([
        { code: "MCI", distanceMiles: 0 },
      ]);

      // Mock searchFlights to return the same flight ID with different prices
      (searchFlights as any).mockImplementation(({ date }: { date: string }) => {
        const price = date === "2025-09-13" ? 1200 : 1000;
        return Promise.resolve([{
          id: "duplicate_flight_id",
          priceUsd: price,
          originAirport: "MCI"
        }]);
      });

      const params = {
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: new Date("2025-09-14T12:00:00Z"),
        targetReturn: new Date("2025-09-19T12:00:00Z"),
        windowDays: 2, // [13th, 14th]
      };

      const results = await runFairGrid(params);

      // Should only have 1 result despite 2 search calls
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("duplicate_flight_id");
      expect(results[0].priceUsd).toBe(1000);
    });
  });
});
