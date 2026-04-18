import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchFlights } from "@/lib/flights/search";
import { getJson } from "serpapi";
import { clearFlightCache } from "@/lib/flights/cache";

// Mock serpapi
vi.mock("serpapi", () => ({
  getJson: vi.fn(),
}));

describe("searchFlights", () => {
  const mockParams = {
    origin: "MCI",
    destination: "MXP",
    date: "2025-09-14",
    returnDate: "2025-09-19",
    adults: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearFlightCache();
    process.env.SERPAPI_KEY = "test_key";
  });

  it("should return empty array if SERPAPI_KEY is missing", async () => {
    delete process.env.SERPAPI_KEY;
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    const results = await searchFlights(mockParams);
    
    expect(results).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("SERPAPI_KEY is missing"));
    consoleSpy.mockRestore();
  });

  it("should call getJson with correct parameters", async () => {
    (getJson as any).mockResolvedValue({
      best_flights: [],
      other_flights: [],
    });

    await searchFlights(mockParams);

    expect(getJson).toHaveBeenCalledWith({
      engine: "google_flights",
      departure_id: "MCI",
      arrival_id: "MXP",
      outbound_date: "2025-09-14",
      return_date: "2025-09-19",
      adults: 1,
      currency: "USD",
      hl: "en",
      api_key: "test_key",
    });
  });

  it("should correctly map SerpAPI results to Flight type", async () => {
    const mockSerpResponse = {
      best_flights: [
        {
          flights: [
            {
              departure_airport: { id: "MCI", time: "2025-09-14 08:00" },
              arrival_airport: { id: "MXP", time: "2025-09-14 22:30" },
              airline: "American Airlines",
              flight_number: "AA 2345",
              duration: 570,
            },
            {
              departure_airport: { id: "MXP", time: "2025-09-19 10:00" },
              arrival_airport: { id: "MCI", time: "2025-09-19 23:45" },
              airline: "American Airlines",
              flight_number: "AA 2346",
              duration: 600,
            },
          ],
          price: 1240,
        },
      ],
    };

    (getJson as any).mockResolvedValue(mockSerpResponse);

    const results = await searchFlights(mockParams);

    expect(results).toHaveLength(1);
    const flight = results[0];
    expect(flight.id).toBe("serp_aa2345_mci_mxp_0914");
    expect(flight.priceUsd).toBe(1240);
    expect(flight.outbound.origin).toBe("MCI");
    expect(flight.outbound.destination).toBe("MXP");
    expect(flight.outbound.flightNumber).toBe("AA 2345");
    expect(flight.inbound.origin).toBe("MXP");
    expect(flight.inbound.destination).toBe("MCI");
    expect(flight.source).toBe("serpapi");
  });

  it("should handle one-way flights by defaulting inbound to outbound", async () => {
    const mockSerpResponse = {
      best_flights: [
        {
          flights: [
            {
              departure_airport: { id: "MCI", time: "2025-09-14 08:00" },
              arrival_airport: { id: "MXP", time: "2025-09-14 22:30" },
              airline: "American Airlines",
              flight_number: "AA 2345",
              duration: 570,
            },
          ],
          price: 600,
        },
      ],
    };

    (getJson as any).mockResolvedValue(mockSerpResponse);

    const results = await searchFlights({ ...mockParams, returnDate: undefined });

    expect(results).toHaveLength(1);
    expect(results[0].inbound.origin).toBe("MCI"); // Defaults to outbound for now
    expect(results[0].priceUsd).toBe(600);
  });

  it("should return empty array and warn on API failure", async () => {
    (getJson as any).mockRejectedValue(new Error("API Error"));
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const results = await searchFlights(mockParams);

    expect(results).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("SerpAPI request failed"),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("should cache results and avoid multiple API calls for the same parameters", async () => {
    (getJson as any).mockResolvedValue({
      best_flights: [],
      other_flights: [],
    });

    // First call
    await searchFlights(mockParams);
    // Second call
    await searchFlights(mockParams);

    expect(getJson).toHaveBeenCalledTimes(1);
  });
});
