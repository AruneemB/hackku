import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose, { Types } from "mongoose";
import Trip from "@/lib/mongodb/models/Trip";
import { connect, closeDatabase, clearDatabase } from "../setup";

describe("Trip Model", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  const validTripData = {
    userId: new Types.ObjectId(),
    status: "draft",
    destination: {
      city: "Milan",
      country: "IT",
      officeLat: 45.4642,
      officeLng: 9.1900,
    },
    dates: {
      departure: new Date("2024-06-01"),
      return: new Date("2024-06-10"),
    },
    budgetCapUsd: Types.Decimal128.fromString("2500.00"),
    totalSpendUsd: Types.Decimal128.fromString("1250.50"),
  };

  it("should create and save a valid trip", async () => {
    const validTrip = new Trip(validTripData);
    const savedTrip = await validTrip.save();

    expect(savedTrip._id).toBeDefined();
    expect(savedTrip.status).toBe("draft");
    expect(savedTrip.destination.city).toBe("Milan");
    expect(savedTrip.budgetCapUsd.toString()).toBe("2500.00");
    expect(savedTrip.totalSpendUsd.toString()).toBe("1250.50");
  });

  it("should fail to save a trip without a required field (budgetCapUsd)", async () => {
    const { budgetCapUsd, ...incompleteData } = validTripData;
    const invalidTrip = new Trip(incompleteData);
    
    let error;
    try {
      await invalidTrip.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.budgetCapUsd).toBeDefined();
  });

  it("should fail to save a trip with an invalid status enum", async () => {
    const invalidTripData = {
      ...validTripData,
      status: "invalid_status",
    };
    const invalidTrip = new Trip(invalidTripData);

    let error;
    try {
      await invalidTrip.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  it("should correctly handle Decimal128 for financial precision", async () => {
    const trip = new Trip({
      ...validTripData,
      totalSpendUsd: Types.Decimal128.fromString("100.10"),
    });
    
    const savedTrip = await trip.save();
    
    // Add another amount
    const additionalSpend = 50.05;
    const newTotal = parseFloat(savedTrip.totalSpendUsd.toString()) + additionalSpend;
    savedTrip.totalSpendUsd = Types.Decimal128.fromString(newTotal.toFixed(2));
    
    const updatedTrip = await savedTrip.save();
    expect(updatedTrip.totalSpendUsd.toString()).toBe("150.15");
  });
});
