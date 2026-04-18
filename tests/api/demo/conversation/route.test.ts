import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@/lib/gemini/client", () => ({
  geminiModel: {
    generateContent: mockGenerateContent,
  },
}));

import { POST } from "@/app/api/demo/conversation/route";

describe("POST /api/demo/conversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not ask for passport expiry again after it has been captured", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            city: "Milan",
            country: "IT",
            departure: "2026-09-14",
            return: "2026-09-19",
            passportExpiry: "2028-04-01",
            purpose: null,
          }),
      },
    });

    const req = new NextRequest("http://localhost/api/demo/conversation", {
      method: "POST",
      body: JSON.stringify({
        frameIndex: 0,
        knownFields: {
          city: "Milan",
          country: "IT",
          departure: "2026-09-14",
          return: "2026-09-19",
        },
        messages: [
          { role: "assistant", content: "What date does your passport expire?" },
          { role: "user", content: "It expires in April 2028." },
        ],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.knownFields.passportExpiry).toBe("2028-04-01");
    expect(data.mascotMessage).toContain("purpose of the trip");
    expect(data.mascotMessage.toLowerCase()).not.toContain("passport expire");
  });

  it("asks for departure and return together when both dates are still missing", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            city: "Milan",
            country: "IT",
            departure: null,
            return: null,
            passportExpiry: null,
            purpose: null,
          }),
      },
    });

    const req = new NextRequest("http://localhost/api/demo/conversation", {
      method: "POST",
      body: JSON.stringify({
        frameIndex: 0,
        knownFields: {
          city: "Milan",
          country: "IT",
        },
        messages: [{ role: "user", content: "I'm going to Milan." }],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.mascotMessage.toLowerCase()).toContain("departure and return dates");
  });

  it("does not ask for years separately once both dates are normalized", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            city: "Milan",
            country: "IT",
            departure: "2026-09-14",
            return: "2026-09-19",
            passportExpiry: null,
            purpose: null,
          }),
      },
    });

    const req = new NextRequest("http://localhost/api/demo/conversation", {
      method: "POST",
      body: JSON.stringify({
        frameIndex: 0,
        knownFields: {
          city: "Milan",
          country: "IT",
        },
        messages: [{ role: "user", content: "September 14 to September 19." }],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.knownFields.departure).toBe("2026-09-14");
    expect(data.knownFields.return).toBe("2026-09-19");
    expect(data.mascotMessage.toLowerCase()).toContain("passport");
    expect(data.mascotMessage.toLowerCase()).not.toContain("year");
  });

  it("completes frame zero when every required field is known", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          JSON.stringify({
            city: "Milan",
            country: "IT",
            departure: "2026-09-14",
            return: "2026-09-19",
            passportExpiry: "2028-04-01",
            purpose: "Client meeting",
          }),
      },
    });

    const req = new NextRequest("http://localhost/api/demo/conversation", {
      method: "POST",
      body: JSON.stringify({
        frameIndex: 0,
        knownFields: {},
        messages: [{ role: "user", content: "I'm going to Milan for a client meeting from September 14 to 19, and my passport expires in April 2028." }],
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.isComplete).toBe(true);
    expect(data.extractedData).toEqual({
      city: "Milan",
      country: "IT",
      departure: "2026-09-14",
      return: "2026-09-19",
      passportExpiry: "2028-04-01",
      purpose: "Client meeting",
    });
  });
});
