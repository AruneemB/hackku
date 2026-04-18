import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/flights/search/route";
import { runFairGrid } from "@/lib/flights/fairGrid";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/flights/fairGrid", () => ({
  runFairGrid: vi.fn(),
}));

describe("POST /api/flights/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const req = new NextRequest("http://localhost/api/flights/search", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors).toContain("homeAirport is required and must be a string.");
    expect(data.errors).toContain("destination is required and must be a string.");
    expect(data.errors).toContain("targetDeparture is required and must be a valid date string.");
    expect(data.errors).toContain("targetReturn is required and must be a valid date string.");
  });

  it("should return 400 if dates are invalid", async () => {
    const req = new NextRequest("http://localhost/api/flights/search", {
      method: "POST",
      body: JSON.stringify({
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: "invalid-date",
        targetReturn: "2025-09-19",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors).toContain("targetDeparture is required and must be a valid date string.");
  });

  it("should return 400 if windowDays or radiusMiles are invalid", async () => {
    const req = new NextRequest("http://localhost/api/flights/search", {
      method: "POST",
      body: JSON.stringify({
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: "2025-09-14",
        targetReturn: "2025-09-19",
        windowDays: -1,
        radiusMiles: "invalid",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errors).toContain("windowDays must be a positive number.");
    expect(data.errors).toContain("radiusMiles must be a non-negative number.");
  });

  it("should call runFairGrid and return results on success", async () => {
    const mockFlights = [{ id: "f1", priceUsd: 100 }];
    (runFairGrid as any).mockResolvedValue(mockFlights);

    const req = new NextRequest("http://localhost/api/flights/search", {
      method: "POST",
      body: JSON.stringify({
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: "2025-09-14",
        targetReturn: "2025-09-19",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockFlights);
    expect(runFairGrid).toHaveBeenCalledWith({
      homeAirport: "MCI",
      destination: "MXP",
      targetDeparture: expect.any(Date),
      targetReturn: expect.any(Date),
      windowDays: undefined,
      radiusMiles: undefined,
    });
  });

  it("should return 500 if runFairGrid fails", async () => {
    (runFairGrid as any).mockRejectedValue(new Error("API Error"));

    const req = new NextRequest("http://localhost/api/flights/search", {
      method: "POST",
      body: JSON.stringify({
        homeAirport: "MCI",
        destination: "MXP",
        targetDeparture: "2025-09-14",
        targetReturn: "2025-09-19",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.message).toBe("Internal server error during flight search.");
  });
});
