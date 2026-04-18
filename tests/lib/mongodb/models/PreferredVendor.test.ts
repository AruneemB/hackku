import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import PreferredVendor from "@/lib/mongodb/models/PreferredVendor";
import { connect, closeDatabase, clearDatabase } from "../setup";

describe("PreferredVendor Model", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  const validVendorData = {
    type: "hotel",
    name: "Milan Marriott Hotel",
    city: "Milan",
    country: "IT",
    location: {
      type: "Point",
      coordinates: [9.1859, 45.4654], // [longitude, latitude]
    },
    address: "Via Washington, 66, 20146 Milano MI, Italy",
    contactPhone: "+39 02 48521",
    amenities: {
      freeBreakfast: true,
      wifi: true,
      gym: true,
    },
    nightlyRateUsd: 250,
    preferred: true,
  };

  it("should create and save a valid preferred vendor", async () => {
    const validVendor = new PreferredVendor(validVendorData);
    const savedVendor = await validVendor.save();

    expect(savedVendor._id).toBeDefined();
    expect(savedVendor.name).toBe("Milan Marriott Hotel");
    expect(savedVendor.location.type).toBe("Point");
    expect(savedVendor.location.coordinates).toEqual([9.1859, 45.4654]);
  });

  it("should fail to save without a required field (type)", async () => {
    const { type, ...incompleteData } = validVendorData;
    const invalidVendor = new PreferredVendor(incompleteData);
    
    let error;
    try {
      await invalidVendor.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  it("should fail with invalid enum value for type", async () => {
    const invalidData = { ...validVendorData, type: "resort" };
    const invalidVendor = new PreferredVendor(invalidData);
    
    let error;
    try {
      await invalidVendor.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  it("should default preferred to true", async () => {
    const { preferred, ...dataWithoutPreferred } = validVendorData;
    const vendor = new PreferredVendor(dataWithoutPreferred);
    const savedVendor = await vendor.save();
    
    expect(savedVendor.preferred).toBe(true);
  });
});
