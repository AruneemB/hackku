import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockFindById, mockFindByIdAndUpdate } = vi.hoisted(() => ({
  mockFindById: vi.fn(),
  mockFindByIdAndUpdate: vi.fn(),
}));

vi.mock("@/lib/mongodb/client", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/mongodb/models/Trip", () => ({
  default: {
    findById: mockFindById,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}));

import { POST } from "@/app/api/trips/[id]/exception/route";

const VALID_ID = "507f1f77bcf86cd799439011";

const TRIP_DOC = {
  _id: VALID_ID,
  status: "active",
  destination: { city: "Milan", country: "IT" },
};

function makeReq(body: unknown) {
  return new NextRequest(`http://localhost/api/trips/${VALID_ID}/exception`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeCtx(id = VALID_ID) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/trips/[id]/exception", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindById.mockResolvedValue(TRIP_DOC);
    mockFindByIdAndUpdate.mockResolvedValue({});
  });

  it("returns 400 for an invalid ObjectId", async () => {
    const res = await POST(makeReq({ subject: "s", body: "b" }), {
      params: Promise.resolve({ id: "bad-id" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid trip id");
  });

  it("returns 400 when subject is missing", async () => {
    const res = await POST(makeReq({ body: "some body text" }), makeCtx());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("subject and body are required");
  });

  it("returns 400 when body is missing", async () => {
    const res = await POST(makeReq({ subject: "Some Subject" }), makeCtx());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("subject and body are required");
  });

  it("returns 400 when both subject and body are missing", async () => {
    const res = await POST(makeReq({}), makeCtx());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("subject and body are required");
  });

  it("returns 404 when the trip does not exist", async () => {
    mockFindById.mockResolvedValue(null);
    const res = await POST(makeReq({ subject: "Sub", body: "Body" }), makeCtx());
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Trip not found");
  });

  it("returns 200 and persists the exception request", async () => {
    const res = await POST(
      makeReq({ subject: "Emergency Exception — Milan", body: "Hi Sarah, requesting approval." }),
      makeCtx()
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      expect.objectContaining({
        $set: expect.objectContaining({
          "exceptionRequest.subject": "Emergency Exception — Milan",
          "exceptionRequest.body": "Hi Sarah, requesting approval.",
          "exceptionRequest.status": "pending",
        }),
      })
    );
  });

  it("does not change trip status — trip stays active", async () => {
    await POST(makeReq({ subject: "Sub", body: "Body" }), makeCtx());
    const call = mockFindByIdAndUpdate.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(call).not.toHaveProperty("$set.status");
    expect(call).not.toHaveProperty("status");
  });

  it("stores a requestedAt Date on the exception request", async () => {
    const before = new Date();
    await POST(makeReq({ subject: "Sub", body: "Body" }), makeCtx());
    const setPayload = (mockFindByIdAndUpdate.mock.calls[0]?.[1] as { $set: Record<string, unknown> }).$set;
    expect(setPayload["exceptionRequest.requestedAt"]).toBeInstanceOf(Date);
    expect((setPayload["exceptionRequest.requestedAt"] as Date).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
