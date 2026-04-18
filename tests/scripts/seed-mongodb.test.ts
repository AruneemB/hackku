import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import budgetCaps from "../../data/policy/budget-caps.json"
import preferredVendors from "../../data/vendors/preferred-vendors.json"
import visaRequirements from "../../data/visa/visa-requirements.json"

// ---------------------------------------------------------------------------
// Hoisted setup: each collection gets its own independent mock object so
// call assertions never bleed across collections.
// ---------------------------------------------------------------------------
const { COLS, DB, CLIENT, mockGenerateEmbedding } = vi.hoisted(() => {
  const makeCol = () => ({
    deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    insertMany: vi.fn().mockResolvedValue({ insertedCount: 1 }),
    insertOne: vi.fn().mockResolvedValue({ insertedId: "id" }),
    createIndex: vi.fn().mockResolvedValue("ok"),
  })

  const COLS = {
    users: makeCol(),
    policies: makeCol(),
    preferred_vendors: makeCol(),
    visa_requirements: makeCol(),
    trips: makeCol(),
  }

  const createCollection = vi.fn().mockResolvedValue({})
  const collection = vi.fn().mockImplementation((name: string) => COLS[name as keyof typeof COLS] ?? makeCol())
  const DB = { createCollection, collection }

  const db = vi.fn().mockReturnValue(DB)
  const connect = vi.fn().mockResolvedValue(undefined)
  const close = vi.fn().mockResolvedValue(undefined)
  // Must use a regular function — arrow functions cannot be called with `new`
  const MongoClient = vi.fn().mockImplementation(function () {
    return { connect, db, close }
  })
  const CLIENT = { MongoClient, connect, db, close }

  const mockGenerateEmbedding = vi.fn().mockResolvedValue(new Array(768).fill(0.05))

  return { COLS, DB, CLIENT, mockGenerateEmbedding }
})

vi.mock("mongodb", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mongodb")>()
  return { ...actual, MongoClient: CLIENT.MongoClient }
})

vi.mock("../../src/lib/gemini/client", () => ({
  generateEmbedding: mockGenerateEmbedding,
}))

import { main } from "../../scripts/seed-mongodb"

// ---------------------------------------------------------------------------

function resetMocks() {
  for (const col of Object.values(COLS)) {
    col.deleteMany.mockClear().mockResolvedValue({ deletedCount: 0 })
    col.insertMany.mockClear().mockResolvedValue({ insertedCount: 1 })
    col.insertOne.mockClear().mockResolvedValue({ insertedId: "id" })
    col.createIndex.mockClear().mockResolvedValue("ok")
  }
  DB.createCollection.mockClear().mockResolvedValue({})
  DB.collection.mockClear().mockImplementation((name: string) => COLS[name as keyof typeof COLS] ?? vi.fn())
  CLIENT.connect.mockClear().mockResolvedValue(undefined)
  CLIENT.close.mockClear().mockResolvedValue(undefined)
  CLIENT.db.mockClear().mockReturnValue(DB)
  CLIENT.MongoClient.mockClear().mockImplementation(function () {
    return { connect: CLIENT.connect, db: CLIENT.db, close: CLIENT.close }
  })
  mockGenerateEmbedding.mockClear().mockResolvedValue(new Array(768).fill(0.05))
}

beforeEach(() => {
  process.env.MONGODB_URI = "mongodb://localhost:27017/test"
  resetMocks()
})

afterEach(() => {
  delete process.env.MONGODB_URI
})

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

describe("connection", () => {
  it("throws when MONGODB_URI is not set", async () => {
    delete process.env.MONGODB_URI
    await expect(main()).rejects.toThrow("MONGODB_URI is not set")
  })

  it("constructs MongoClient with the env URI", async () => {
    await main()
    expect(CLIENT.MongoClient).toHaveBeenCalledWith("mongodb://localhost:27017/test")
  })

  it("calls connect() before any DB operations", async () => {
    await main()
    expect(CLIENT.connect).toHaveBeenCalledOnce()
  })

  it("selects the 'hackku' database", async () => {
    await main()
    expect(CLIENT.db).toHaveBeenCalledWith("hackku")
  })

  it("closes the connection after all seeding completes", async () => {
    await main()
    expect(CLIENT.close).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// flight_status TimeSeries collection
// ---------------------------------------------------------------------------

describe("flight_status TimeSeries collection", () => {
  it("creates flight_status with correct timeseries options", async () => {
    await main()
    expect(DB.createCollection).toHaveBeenCalledWith("flight_status", {
      timeseries: { timeField: "timestamp", metaField: "metadata", granularity: "minutes" },
    })
  })

  it("continues seeding even when flight_status already exists (error swallowed)", async () => {
    DB.createCollection.mockRejectedValueOnce(new Error("Collection already exists"))
    await expect(main()).resolves.toBeUndefined()
    // Verify later steps still ran
    expect(COLS.users.insertMany).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

describe("users", () => {
  it("clears the users collection before inserting", async () => {
    await main()
    expect(COLS.users.deleteMany).toHaveBeenCalledWith({})
  })

  it("inserts exactly two users", async () => {
    await main()
    const [users] = COLS.users.insertMany.mock.calls[0] as [unknown[]]
    expect(users).toHaveLength(2)
  })

  it("seeds Kelli Thompson with required fields", async () => {
    await main()
    const [users] = COLS.users.insertMany.mock.calls[0] as [Array<Record<string, unknown>>]
    const kelli = users.find((u) => u.name === "Kelli Thompson")
    expect(kelli).toBeDefined()
    expect(kelli!.email).toBe("kelli.thompson@lockton.com")
    expect(kelli!.citizenship).toBe("US")
    expect(kelli!.department).toBe("Risk Management")
    expect(kelli!.homeAirports).toEqual(["MCI"])
  })

  it("sets Kelli's passport expiry to 2026-03-15 (intentionally expiring soon)", async () => {
    await main()
    const [users] = COLS.users.insertMany.mock.calls[0] as [Array<Record<string, unknown>>]
    const kelli = users.find((u) => u.name === "Kelli Thompson")!
    expect((kelli.passport as { expiry: Date }).expiry).toEqual(new Date("2026-03-15"))
  })

  it("seeds James Walker as the manager with null managerId", async () => {
    await main()
    const [users] = COLS.users.insertMany.mock.calls[0] as [Array<Record<string, unknown>>]
    const manager = users.find((u) => u.name === "James Walker")
    expect(manager).toBeDefined()
    expect(manager!.email).toBe("j.walker@lockton.com")
    expect(manager!.managerId).toBeNull()
  })

  it("links Kelli's managerId to James Walker's _id", async () => {
    await main()
    const [users] = COLS.users.insertMany.mock.calls[0] as [Array<Record<string, unknown>>]
    const kelli = users.find((u) => u.name === "Kelli Thompson")!
    const manager = users.find((u) => u.name === "James Walker")!
    expect(String(kelli.managerId)).toBe(String(manager._id))
  })
})

// ---------------------------------------------------------------------------
// Policies with Gemini embeddings
// ---------------------------------------------------------------------------

describe("policies with embeddings", () => {
  it("clears the policies collection before inserting", async () => {
    await main()
    expect(COLS.policies.deleteMany).toHaveBeenCalledWith({})
  })

  it("inserts one policy per city", async () => {
    await main()
    expect(COLS.policies.insertOne).toHaveBeenCalledTimes(budgetCaps.cities.length)
  })

  it("calls generateEmbedding once per city", async () => {
    await main()
    expect(mockGenerateEmbedding).toHaveBeenCalledTimes(budgetCaps.cities.length)
  })

  it("embeds each city's handbookExcerpt text", async () => {
    await main()
    for (const city of budgetCaps.cities) {
      expect(mockGenerateEmbedding).toHaveBeenCalledWith(city.handbookExcerpt)
    }
  })

  it("stores the embedding vector on each policy document", async () => {
    const fakeVec = new Array(768).fill(0.99)
    mockGenerateEmbedding.mockResolvedValue(fakeVec)
    await main()
    for (const [doc] of COLS.policies.insertOne.mock.calls as [Record<string, unknown>][]) {
      expect(doc.embedding).toEqual(fakeVec)
    }
  })

  it("seeds all 6 expected city codes", async () => {
    await main()
    const seededCodes = COLS.policies.insertOne.mock.calls.map(
      ([doc]: [Record<string, unknown>]) => doc.cityCode
    )
    expect(seededCodes).toEqual(expect.arrayContaining(["MIL", "LON", "PAR", "TYO", "YTO", "MEX"]))
  })
})

// ---------------------------------------------------------------------------
// Preferred vendors
// ---------------------------------------------------------------------------

describe("preferred vendors", () => {
  it("clears preferred_vendors before inserting", async () => {
    await main()
    expect(COLS.preferred_vendors.deleteMany).toHaveBeenCalledWith({})
  })

  it("inserts all vendors from the data file", async () => {
    await main()
    const [vendors] = COLS.preferred_vendors.insertMany.mock.calls[0] as [unknown[]]
    expect(vendors).toHaveLength(preferredVendors.vendors.length)
  })

  it("creates a 2dsphere index on the location field", async () => {
    await main()
    expect(COLS.preferred_vendors.createIndex).toHaveBeenCalledWith({ location: "2dsphere" })
  })
})

// ---------------------------------------------------------------------------
// Visa requirements
// ---------------------------------------------------------------------------

describe("visa requirements", () => {
  it("clears visa_requirements before inserting", async () => {
    await main()
    expect(COLS.visa_requirements.deleteMany).toHaveBeenCalledWith({})
  })

  it("inserts all 6 visa records", async () => {
    await main()
    const [reqs] = COLS.visa_requirements.insertMany.mock.calls[0] as [unknown[]]
    expect(reqs).toHaveLength(6)
    expect(reqs).toHaveLength(visaRequirements.requirements.length)
  })

  it("creates a compound index on destinationCountry + citizenship", async () => {
    await main()
    expect(COLS.visa_requirements.createIndex).toHaveBeenCalledWith({ destinationCountry: 1, citizenship: 1 })
  })

  it("covers all 6 demo destination countries", async () => {
    await main()
    const [reqs] = COLS.visa_requirements.insertMany.mock.calls[0] as [Array<{ destinationCountry: string }>]
    const countries = reqs.map((r) => r.destinationCountry)
    expect(countries).toEqual(expect.arrayContaining(["IT", "GB", "FR", "JP", "CA", "MX"]))
  })
})

// ---------------------------------------------------------------------------
// Demo trip
// ---------------------------------------------------------------------------

describe("demo trip", () => {
  it("deletes Kelli's existing trips before inserting", async () => {
    await main()
    // deleteMany is called with the userId ObjectId — just verify it was called
    expect(COLS.trips.deleteMany).toHaveBeenCalledOnce()
    const [filter] = COLS.trips.deleteMany.mock.calls[0] as [Record<string, unknown>]
    expect(filter).toHaveProperty("userId")
  })

  it("inserts exactly one trip document", async () => {
    await main()
    expect(COLS.trips.insertOne).toHaveBeenCalledOnce()
  })

  it("sets trip status to draft", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    expect(trip.status).toBe("draft")
  })

  it("sets destination to Milan, Italy with office coordinates", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    const dest = trip.destination as Record<string, unknown>
    expect(dest.city).toBe("Milan")
    expect(dest.country).toBe("IT")
    expect(dest.officeLat).toBe(45.4654)
    expect(dest.officeLng).toBe(9.1866)
  })

  it("sets departure Sep 14 and return Sep 19 2025", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    const dates = trip.dates as { departure: Date; return: Date }
    expect(dates.departure).toEqual(new Date("2025-09-14"))
    expect(dates.return).toEqual(new Date("2025-09-19"))
  })

  it("initialises flights, hotels and receipts as empty arrays", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    expect(trip.flights).toEqual([])
    expect(trip.hotels).toEqual([])
    expect(trip.receipts).toEqual([])
  })

  it("sets budgetCapUsd to 2800 and totalSpendUsd to 0 (Decimal128)", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    expect(String(trip.budgetCapUsd)).toBe("2800")
    expect(String(trip.totalSpendUsd)).toBe("0")
  })

  it("sets selectedBundle and policyFindings to null", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    expect(trip.selectedBundle).toBeNull()
    expect(trip.policyFindings).toBeNull()
  })

  it("includes a gmailThreadId of null in approvalThread", async () => {
    await main()
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    const thread = trip.approvalThread as Record<string, unknown>
    expect(thread.gmailThreadId).toBeNull()
    expect(thread.status).toBeNull()
  })

  it("links the trip to Kelli's userId", async () => {
    await main()
    const [users] = COLS.users.insertMany.mock.calls[0] as [Array<Record<string, unknown>>]
    const kelli = users.find((u) => u.name === "Kelli Thompson")!
    const [trip] = COLS.trips.insertOne.mock.calls[0] as [Record<string, unknown>]
    expect(String(trip.userId)).toBe(String(kelli._id))
  })
})
