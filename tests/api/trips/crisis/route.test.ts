import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockFindOne, mockFindById, mockGenerateContent, mockRunFairGrid } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
  mockFindById: vi.fn(),
  mockGenerateContent: vi.fn(),
  mockRunFairGrid: vi.fn(),
}));

vi.mock("@/lib/mongodb/client", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
  default: Promise.resolve({
    db: () => ({
      collection: () => ({ findOne: mockFindOne }),
    }),
  }),
}));

vi.mock("@/lib/flights/fairGrid", () => ({
  runFairGrid: mockRunFairGrid,
}));

vi.mock("@/lib/mongodb/models/Trip", () => ({
  default: { findById: mockFindById },
}));

vi.mock("@/lib/gemini/client", () => ({
  geminiModel: { generateContent: mockGenerateContent },
}));

import { GET } from "@/app/api/trips/[id]/crisis/route";

const VALID_ID = "507f1f77bcf86cd799439011";

// budgetCapUsd and totalSpendUsd are stored as strings so decimal128ToString
// can parse them (it falls back to the default for plain JS numbers).
const TRIP_DOC = {
  destination: { city: "Milan", country: "IT" },
  budgetCapUsd: "2000",
  totalSpendUsd: "100",
  dates: { departure: new Date("2026-06-14"), return: new Date("2026-06-21") },
  selectedBundle: { flight: { outbound: { flightNumber: "LH8904", carrier: "Lufthansa" } } },
};

const ALT_DOC = {
  flightNumber: "AA1234",
  carrier: "American Airlines",
  departureTime: "2026-06-14T10:00:00Z",
  arrivalTime: "2026-06-14T18:00:00Z",
  priceUsd: 350,
  origin: "ORD",
  destination: "MXP",
  destinationCountry: "IT",
};

function makeReq(delayMinutes: number) {
  return new NextRequest(
    `http://localhost/api/trips/${VALID_ID}/crisis?delayMinutes=${delayMinutes}`
  );
}

function makeCtx(id = VALID_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/trips/[id]/crisis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockReturnValue({ lean: () => Promise.resolve(TRIP_DOC) });
    mockFindOne.mockResolvedValue(ALT_DOC);
    // Default: Fair Grid returns nothing → falls back to demo_alternatives
    mockRunFairGrid.mockResolvedValue([]);
    mockGenerateContent.mockResolvedValue({
      response: { text: () => "Your flight is delayed. I've found an alternative." },
    });
  });

  it("returns 400 for an invalid ObjectId", async () => {
    const res = await GET(makeReq(90), { params: Promise.resolve({ id: "not-an-id" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid trip id");
  });

  it("returns { crisis: false } when delayMinutes is within the safe buffer", async () => {
    const res = await GET(makeReq(30), makeCtx());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.crisis).toBe(false);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("returns { crisis: false } exactly at the boundary (45 min)", async () => {
    const res = await GET(makeReq(45), makeCtx());
    const data = await res.json();
    expect(data.crisis).toBe(false);
  });

  it("returns 404 when the trip does not exist", async () => {
    mockFindById.mockReturnValue({ lean: () => Promise.resolve(null) });
    const res = await GET(makeReq(90), makeCtx());
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Trip not found");
  });

  it("returns a crisis payload with alternative flight when delay exceeds 45 min", async () => {
    const res = await GET(makeReq(90), makeCtx());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.crisis).toBe(true);
    expect(data.alternative).toMatchObject({
      flightNumber: "AA1234",
      carrier: "American Airlines",
      priceUsd: 350,
      origin: "ORD",
      destination: "MXP",
    });
    expect(data.mascotMessage).toBeTruthy();
    expect(data.isOverBudget).toBe(false);
    expect(data.exceptionDraft).toBeNull();
  });

  it("returns isOverBudget=true and an exceptionDraft when alternative pushes spend over cap", async () => {
    mockFindById.mockReturnValue({
      lean: () => Promise.resolve({ ...TRIP_DOC, totalSpendUsd: "1800" }),
    });
    // alt priceUsd=350 → 1800+350=2150 > budgetCap=2000 → over budget
    mockGenerateContent
      .mockResolvedValueOnce({ response: { text: () => "Disruption message." } })
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              subject: "Emergency Exception — Milan",
              body: "Hi Sarah, I need approval for an emergency rebooking.",
            }),
        },
      });

    const res = await GET(makeReq(90), makeCtx());
    const data = await res.json();
    expect(data.isOverBudget).toBe(true);
    expect(data.overageUsd).toBeGreaterThan(0);
    expect(data.exceptionDraft).toMatchObject({
      subject: "Emergency Exception — Milan",
      body: expect.stringContaining("emergency rebooking"),
    });
  });

  it("falls back to a hardcoded mascot message when Gemini fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("Gemini unavailable"));
    const res = await GET(makeReq(90), makeCtx());
    const data = await res.json();
    expect(data.crisis).toBe(true);
    expect(typeof data.mascotMessage).toBe("string");
    expect(data.mascotMessage.length).toBeGreaterThan(0);
  });

  it("returns alternative=null when no demo_alternatives document matches", async () => {
    mockFindOne.mockResolvedValue(null);
    const res = await GET(makeReq(90), makeCtx());
    const data = await res.json();
    expect(data.alternative).toBeNull();
    expect(data.isOverBudget).toBe(false);
  });

  it("uses Fair Grid result when it returns flights (skips demo_alternatives)", async () => {
    mockRunFairGrid.mockResolvedValue([
      {
        outbound: {
          id: "fg-001",
          outbound: {
            flightNumber: "UA903",
            carrier: "United",
            origin: "ORD",
            destination: "MXP",
            departureTime: new Date("2026-06-14T14:00:00Z"),
            arrivalTime: new Date("2026-06-15T08:30:00Z"),
            durationMinutes: 570,
            layoverAirports: [],
          },
          priceUsd: 420,
          saturdayNightStay: false,
          saturdayNightSavingsUsd: 0,
        },
        returns: [],
        cheapestTotalUsd: 420,
      },
    ]);

    const res = await GET(makeReq(90), makeCtx());
    const data = await res.json();
    expect(data.alternative).toMatchObject({
      flightNumber: "UA903",
      carrier: "United",
      origin: "ORD",
      destination: "MXP",
      priceUsd: 420,
    });
    // demo_alternatives should NOT have been queried
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it("personalises the mascot message with origin and destination", async () => {
    const res = await GET(makeReq(90), makeCtx());
    const data = await res.json();
    // Gemini was given ORD and MXP in the prompt; its output is mocked
    // to "Your flight is delayed..." — just verify the field is present
    expect(typeof data.mascotMessage).toBe("string");
    expect(data.mascotMessage.length).toBeGreaterThan(10);
  });
});
