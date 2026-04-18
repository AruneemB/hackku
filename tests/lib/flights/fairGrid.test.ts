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

      // Each (airport, date) now fires 2 searches: outbound + return
      (searchFlights as any).mockImplementation(({ origin, date }: { origin: string; date: string }) => {
        const price = origin === "MCI" ? 1000 : 1100;
        return Promise.resolve([{
          id: `flight_${origin}_${date}`,
          priceUsd: price,
          saturdayNightStay: false,
          saturdayNightSavingsUsd: 0,
          originAirport: origin,
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

      // 2 airports * 3 dates * 2 (outbound + return) = 12 searches
      expect(searchFlights).toHaveBeenCalledTimes(12);
      expect(results).toHaveLength(6);

      // Sorted by cheapestTotalUsd: MCI groups (1000 + 1100 = 2100) then MKC groups (1100 + 1100 = 2200)
      expect(results[0].outbound.priceUsd).toBe(1000);
      expect(results[0].outbound.originAirport).toBe("MCI");
      expect(results[0].outbound.distanceFromHomeAirportMiles).toBe(0);

      expect(results[5].outbound.priceUsd).toBe(1100);
      expect(results[5].outbound.originAirport).toBe("MKC");
      expect(results[5].outbound.distanceFromHomeAirportMiles).toBe(5);
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
      //   2025-09-13 (Sat) -> 2025-09-18 (Thursday). Dep Sat, Ret Thu -> Sat Night Stay (ret > firstSat on or after Sat = Sep 13).
      //   2025-09-14 (Sun) -> 2025-09-19 (Friday). Dep Sun, Ret Fri -> No Sat Night.
      //   2025-09-15 (Mon) -> 2025-09-20 (Saturday). Dep Mon, Ret Sat -> No Sat Night (not strictly after Sat 20th).
      //
      // Make dep 2025-09-13 (satNight) cheap: outbound price 300, return 500 -> total 800
      // Make other deps: outbound 500, return 500 -> total 1000
      // Savings = 1000 - 800 = 200

      (searchFlights as any).mockImplementation(({ origin, date }: { origin: string; date: string }) => {
        const isOutbound = origin !== "MXP";
        const price = (isOutbound && date === "2025-09-13") ? 300 : 500;
        return Promise.resolve([{
          id: `flight_${origin}_${date}`,
          priceUsd: price,
          originAirport: origin,
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

      // The group departing on 2025-09-13 should have saturdayNightStay: true and savings 200
      const satGroup = results.find(g => g.outbound.saturdayNightStay);
      expect(satGroup).toBeDefined();
      expect(satGroup!.outbound.saturdayNightSavingsUsd).toBe(200);
      expect(satGroup!.cheapestTotalUsd).toBe(800); // 300 + 500

      const nonSatGroup = results.find(g => !g.outbound.saturdayNightStay);
      expect(nonSatGroup).toBeDefined();
      expect(nonSatGroup!.outbound.saturdayNightSavingsUsd).toBe(0);
    });

    it("should deduplicate groups by outbound ID keeping the lowest cheapestTotalUsd", async () => {
      (getAirportsWithinRadius as any).mockReturnValue([
        { code: "MCI", distanceMiles: 0 },
      ]);

      // Both dep dates return same outbound flight ID; return flight has same ID too
      // dep 2025-09-13: outbound price 1200, return price 500 -> total 1700
      // dep 2025-09-14: outbound price 500, return price 500 -> total 1000
      (searchFlights as any).mockImplementation(({ origin, date }: { origin: string; date: string }) => {
        const isOutbound = origin !== "MXP";
        const price = (isOutbound && date === "2025-09-13") ? 1200 : 500;
        return Promise.resolve([{
          id: "duplicate_flight_id",
          priceUsd: price,
          originAirport: origin,
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

      // Should only have 1 result despite 2 outbound searches returning same ID
      expect(results).toHaveLength(1);
      expect(results[0].outbound.id).toBe("duplicate_flight_id");
      // Cheapest total is from dep 2025-09-14: 500 + 500 = 1000
      expect(results[0].cheapestTotalUsd).toBe(1000);
      expect(results[0].outbound.priceUsd).toBe(500);
    });
  });
});
