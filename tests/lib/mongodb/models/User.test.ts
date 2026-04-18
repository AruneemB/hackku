import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import User from "@/lib/mongodb/models/User";
import { connect, closeDatabase, clearDatabase } from "../setup";

describe("User Model", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  it("should create and save a valid user", async () => {
    const userData = {
      name: "Kelli Thompson",
      email: "kelli@lockton.com",
      citizenship: "US",
      passport: {
        number: "XXXXXXXXX",
        expiry: new Date("2026-03-15"),
        country: "US",
      },
      department: "Risk Management",
      homeAirports: ["MCI"],
    };

    const validUser = new User(userData);
    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.passport.number).toBe(userData.passport.number);
  });

  it("should fail to save a user without a required field (email)", async () => {
    const userData = {
      name: "Kelli Thompson",
      citizenship: "US",
      passport: {
        number: "XXXXXXXXX",
        expiry: new Date("2026-03-15"),
        country: "US",
      },
      department: "Risk Management",
    };

    const invalidUser = new User(userData);
    let error;
    try {
      await invalidUser.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
  });

  it("should fail to save a duplicate email", async () => {
    const userData = {
      name: "Kelli Thompson",
      email: "kelli@lockton.com",
      citizenship: "US",
      passport: {
        number: "XXXXXXXXX",
        expiry: new Date("2026-03-15"),
        country: "US",
      },
      department: "Risk Management",
    };

    await new User(userData).save();
    
    // In Mongoose with MongoMemoryServer, we need to ensure indexes are built
    await User.init();

    const duplicateUser = new User(userData);
    let error;
    try {
      await duplicateUser.save();
    } catch (err: any) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // Duplicate key error
  });
});
