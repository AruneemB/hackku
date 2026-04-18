import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockToArray,
  mockAggregate,
  mockGenerateEmbedding,
  mockGenerateContent,
  mockBuildPolicySummaryPrompt,
  mockUserFindById,
  mockVisaFindOne,
} = vi.hoisted(() => {
  const mockToArray = vi.fn();
  const mockAggregate = vi.fn(() => ({ toArray: mockToArray }));
  const mockGenerateEmbedding = vi.fn().mockResolvedValue(new Array(768).fill(0.1));
  const mockGenerateContent = vi.fn();
  const mockBuildPolicySummaryPrompt = vi.fn().mockReturnValue("mock prompt");
  const mockUserFindById = vi.fn();
  const mockVisaFindOne = vi.fn();
  return {
    mockToArray,
    mockAggregate,
    mockGenerateEmbedding,
    mockGenerateContent,
    mockBuildPolicySummaryPrompt,
    mockUserFindById,
    mockVisaFindOne,
  };
});

vi.mock("@/lib/mongodb/client", () => ({
  default: Promise.resolve({
    db: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({ aggregate: mockAggregate }),
    }),
  }),
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/gemini/client", () => ({
  generateEmbedding: mockGenerateEmbedding,
  geminiModel: { generateContent: mockGenerateContent },
}));

vi.mock("@/lib/gemini/prompts", () => ({
  buildPolicySummaryPrompt: mockBuildPolicySummaryPrompt,
}));

vi.mock("@/lib/mongodb/models/User", () => ({
  default: { findById: mockUserFindById },
}));

vi.mock("@/lib/mongodb/models/VisaRequirement", () => ({
  default: { findOne: mockVisaFindOne },
}));

// Import AFTER mocks are registered
import { queryPolicyForTrip } from "../../../src/lib/policy/vectorSearch";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const mockTrip = {
  _id: "trip-1",
  userId: "user-1",
  destination: { city: "Milan", country: "IT", officeLat: 45.46, officeLng: 9.19 },
  dates: { departure: new Date("2025-09-14"), return: new Date("2025-09-19") },
} as any;

const mockPolicyDoc = {
  cityCode: "MIL",
  country: "IT",
  hotelNightlyCapUsd: 200,
  flightCapUsd: 1500,
  mealAllowancePerDayUsd: 75,
  handbookExcerpt: "Milan policy text",
};

const mockVisaDoc = {
  destinationCountry: "IT",
  citizenship: "US",
  visaRequired: false,
  visaType: null,
  stayLimitDays: 90,
  notes: "No visa required — Schengen 90-day rule applies.",
  applicationUrl: null,
  toObject: vi.fn().mockReturnThis(),
};

const mockUser = { _id: "user-1", citizenship: "US" };

const mockFindings = {
  hotelNightlyCapUsd: 200,
  flightCapUsd: 1500,
  mealAllowancePerDayUsd: 75,
  requiresManagerApproval: false,
  approvalReason: null,
  mascotSummary: "All good!",
};

// ---------------------------------------------------------------------------

describe("queryPolicyForTrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToArray.mockResolvedValue([mockPolicyDoc]);
    mockUserFindById.mockResolvedValue(mockUser);
    mockVisaFindOne.mockResolvedValue(mockVisaDoc);
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockFindings) },
    });
  });

  it("returns PolicyFindings with visa overwritten from DB on success", async () => {
    const result = await queryPolicyForTrip(mockTrip);

    expect(result.hotelNightlyCapUsd).toBe(200);
    expect(result.flightCapUsd).toBe(1500);
    expect(result.requiresManagerApproval).toBe(false);
    expect(result.visa).toEqual(mockVisaDoc);
  });

  it("generates embedding from trip destination", async () => {
    await queryPolicyForTrip(mockTrip);

    expect(mockGenerateEmbedding).toHaveBeenCalledOnce();
    expect(mockGenerateEmbedding).toHaveBeenCalledWith(
      "travel policy budget rules for Milan IT"
    );
  });

  it("passes costs to buildPolicySummaryPrompt when provided", async () => {
    const costs = { hotelNightlyRateUsd: 215, flightCostUsd: 1400 };
    await queryPolicyForTrip(mockTrip, costs);

    expect(mockBuildPolicySummaryPrompt).toHaveBeenCalledWith(
      mockPolicyDoc,
      mockTrip,
      expect.anything(),
      costs
    );
  });

  it("throws when vector search returns no policy documents", async () => {
    mockToArray.mockResolvedValueOnce([]);

    await expect(queryPolicyForTrip(mockTrip)).rejects.toThrow(
      "No policy found for Milan, IT"
    );
  });

  it("throws when the trip's user is not found", async () => {
    mockUserFindById.mockResolvedValueOnce(null);

    await expect(queryPolicyForTrip(mockTrip)).rejects.toThrow(
      "User not found: user-1"
    );
  });

  it("throws when visa requirements are not found for the destination", async () => {
    mockVisaFindOne.mockResolvedValueOnce(null);

    await expect(queryPolicyForTrip(mockTrip)).rejects.toThrow(
      "Visa requirements not found for US to IT"
    );
  });

  it("throws when Gemini returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => "not valid json at all" },
    });

    await expect(queryPolicyForTrip(mockTrip)).rejects.toThrow(
      "Invalid PolicyFindings JSON returned from Gemini"
    );
  });

  it("propagates errors from the embedding call", async () => {
    mockGenerateEmbedding.mockRejectedValueOnce(new Error("Embedding API quota exceeded"));

    await expect(queryPolicyForTrip(mockTrip)).rejects.toThrow(
      "Embedding API quota exceeded"
    );
  });
});
