import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import VisaRequirement from "@/lib/mongodb/models/VisaRequirement";
import { connect, closeDatabase, clearDatabase } from "../setup";

describe("VisaRequirement Model", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  const validVisaData = {
    destinationCountry: "IT",
    citizenship: "US",
    visaRequired: false,
    visaType: null,
    stayLimitDays: 90,
    notes: "No visa required for US citizens for stays up to 90 days for tourism or business.",
    applicationUrl: null,
  };

  it("should create and save a valid visa requirement", async () => {
    const validVisa = new VisaRequirement(validVisaData);
    const savedVisa = await validVisa.save();

    expect(savedVisa._id).toBeDefined();
    expect(savedVisa.destinationCountry).toBe("IT");
    expect(savedVisa.citizenship).toBe("US");
    expect(savedVisa.visaRequired).toBe(false);
    expect(savedVisa.stayLimitDays).toBe(90);
  });

  it("should fail to save without a required field (destinationCountry)", async () => {
    const { destinationCountry, ...incompleteData } = validVisaData;
    const invalidVisa = new VisaRequirement(incompleteData);
    
    let error;
    try {
      await invalidVisa.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.destinationCountry).toBeDefined();
  });

  it("should fail to save a duplicate destinationCountry + citizenship pair", async () => {
    await new VisaRequirement(validVisaData).save();
    
    // Ensure indexes are built
    await VisaRequirement.init();

    const duplicateVisa = new VisaRequirement(validVisaData);
    let error;
    try {
      await duplicateVisa.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Duplicate key error
  });
});
