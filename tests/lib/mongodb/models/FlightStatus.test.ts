import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("FlightStatus Model (TimeSeries)", () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let FlightStatus: any;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    
    // Dynamically import FlightStatus AFTER setting MONGODB_URI
    FlightStatus = await import("@/lib/mongodb/models/FlightStatus");
    
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db("hackku");
    
    // Create the TimeSeries collection as required by the model
    await db.createCollection("flight_status", {
      timeseries: {
        timeField: "timestamp",
        metaField: "metadata",
        granularity: "minutes",
      },
    });
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const db = client.db("hackku");
    await db.collection("flight_status").deleteMany({});
  });

  it("should write and retrieve flight status updates", async () => {
    const update = {
      flightNumber: "AA123",
      tripId: "trip_789",
      status: "delayed",
      delayMinutes: 45,
      gate: "B22",
      destination: "MXP",
      timestamp: new Date().toISOString(),
    };

    await FlightStatus.writeFlightStatus(update);

    const latest = await FlightStatus.getLatestFlightStatus("AA123");
    
    expect(latest).toBeDefined();
    expect(latest?.flightNumber).toBe("AA123");
    expect(latest?.status).toBe("delayed");
    expect(latest?.delayMinutes).toBe(45);
    expect(latest?.gate).toBe("B22");
    expect(latest?.destination).toBe("MXP");
    expect(latest?.timestamp).toBeInstanceOf(Date);
  });

  it("should return null if no status exists for a flight", async () => {
    const latest = await FlightStatus.getLatestFlightStatus("NONEXISTENT");
    expect(latest).toBeNull();
  });

  it("should return the most recent update when multiple exist", async () => {
    const base = { flightNumber: "DL456", tripId: "trip_1", destination: "LHR", delayMinutes: 0 };
    
    const older = { ...base, status: "on_time", timestamp: new Date("2026-04-18T10:00:00Z").toISOString() };
    const newer = { ...base, status: "delayed", delayMinutes: 30, timestamp: new Date("2026-04-18T11:00:00Z").toISOString() };

    await FlightStatus.writeFlightStatus(older);
    await FlightStatus.writeFlightStatus(newer);

    const latest = await FlightStatus.getLatestFlightStatus("DL456");
    expect(latest?.status).toBe("delayed");
    expect(latest?.timestamp.toISOString()).toBe(new Date("2026-04-18T11:00:00Z").toISOString());
  });
});
