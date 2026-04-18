import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/visa/check/route";
import VisaRequirement from "@/lib/mongodb/models/VisaRequirement";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/mongodb/client", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/mongodb/models/VisaRequirement", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

describe("POST /api/visa/check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return visa requirement for valid country and citizenship", async () => {
    const mockDoc = {
      destinationCountry: "IT",
      citizenship: "US",
      visaRequired: false,
      stayLimitDays: 90,
      notes: "Test notes",
    };
    (VisaRequirement.findOne as any).mockResolvedValue(mockDoc);

    const req = new NextRequest("http://localhost/api/visa/check", {
      method: "POST",
      body: JSON.stringify({
        destinationCountry: "IT",
        citizenship: "US",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockDoc);
    expect(VisaRequirement.findOne).toHaveBeenCalledWith({
      destinationCountry: "IT",
      citizenship: "US",
    });
  });

  it("should return 404 if visa requirement not found", async () => {
    (VisaRequirement.findOne as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/visa/check", {
      method: "POST",
      body: JSON.stringify({
        destinationCountry: "XX",
        citizenship: "US",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Visa requirement record not found for this destination and citizenship.");
  });

  it("should return 500 if database search fails", async () => {
    (VisaRequirement.findOne as any).mockRejectedValue(new Error("Database error"));

    const req = new NextRequest("http://localhost/api/visa/check", {
      method: "POST",
      body: JSON.stringify({
        destinationCountry: "IT",
        citizenship: "US",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Internal server error while checking visa requirements.");
  });
});
