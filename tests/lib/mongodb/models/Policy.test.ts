import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import Policy from "@/lib/mongodb/models/Policy";
import { connect, closeDatabase, clearDatabase } from "../setup";

describe("Policy Model", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  const validPolicyData = {
    cityCode: "MIL",
    country: "IT",
    hotelNightlyCapUsd: 300,
    flightCapUsd: 1500,
    mealAllowancePerDayUsd: 100,
    preferredTransport: ["Taxi", "Uber", "Metro"],
    requiresApprovalAboveUsd: 5000,
    handbookExcerpt: "Policy excerpt for Milan...",
    embedding: new Array(768).fill(0.1), // Gemini embedding size
  };

  it("should create and save a valid policy", async () => {
    const validPolicy = new Policy(validPolicyData);
    const savedPolicy = await validPolicy.save();

    expect(savedPolicy._id).toBeDefined();
    expect(savedPolicy.cityCode).toBe("MIL");
    expect(savedPolicy.country).toBe("IT");
    expect(savedPolicy.hotelNightlyCapUsd).toBe(300);
    expect(savedPolicy.embedding).toHaveLength(768);
  });

  it("should fail to save a policy without a required field (cityCode)", async () => {
    const { cityCode, ...incompleteData } = validPolicyData;
    const invalidPolicy = new Policy(incompleteData);
    
    let error;
    try {
      await invalidPolicy.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.cityCode).toBeDefined();
  });

  it("should fail to save a policy without a required field (embedding)", async () => {
    const { embedding, ...incompleteData } = validPolicyData;
    const invalidPolicy = new Policy(incompleteData);
    
    let error;
    try {
      await invalidPolicy.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.embedding).toBeDefined();
  });
});
