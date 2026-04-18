// ============================================================
// SCRIPT: Seed MongoDB Atlas
// OWNER: Track C (Data & Integrations)
// USAGE: npm run seed
//
// Seeds: users, policies (with Gemini embeddings), preferred_vendors,
//        visa_requirements, demo trip, flight_status TimeSeries collection
//
// ENV REQUIRED: MONGODB_URI, GEMINI_API_KEY
// Safe to re-run — drops and recreates all collections.
// ============================================================

import { MongoClient, ObjectId, Decimal128 } from "mongodb"
import { generateEmbedding } from "../src/lib/gemini/client"
import budgetCaps from "../data/policy/budget-caps.json"
import preferredVendors from "../data/vendors/preferred-vendors.json"
import visaRequirements from "../data/visa/visa-requirements.json"

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set")

  const client = new MongoClient(uri)
  await client.connect()
  console.log("✅ Connected to MongoDB Atlas")

  const db = client.db("hackku")

  // Step 1: Create TimeSeries collection
  try {
    await db.createCollection("flight_status", {
      timeseries: { timeField: "timestamp", metaField: "metadata", granularity: "minutes" },
    })
    console.log("✅ flight_status TimeSeries collection created")
  } catch {
    console.log("ℹ️  flight_status already exists — skipping")
  }

  // Step 2: Seed users
  await db.collection("users").deleteMany({})
  const kelliId = new ObjectId()
  const managerId = new ObjectId()
  await db.collection("users").insertMany([
    {
      _id: kelliId,
      name: "Kelli Thompson",
      email: "kelli.thompson@lockton.com",
      citizenship: "US",
      passport: {
        number: "XXXXXXXXX",
        expiry: new Date("2026-03-15"), // intentionally expiring soon!
        country: "US",
      },
      department: "Risk Management",
      managerId,
      homeAirports: ["MCI"],
    },
    {
      _id: managerId,
      name: "James Walker",
      email: "j.walker@lockton.com",
      citizenship: "US",
      passport: { expiry: new Date("2028-06-01"), country: "US" },
      department: "Management",
      managerId: null,
      homeAirports: ["MCI"],
    },
  ])
  console.log("✅ Seeded users: Kelli Thompson + James Walker")

  // Step 3: Seed policies with Gemini embeddings
  await db.collection("policies").deleteMany({})
  for (const city of budgetCaps.cities) {
    const embedding = await generateEmbedding(city.handbookExcerpt)
    await db.collection("policies").insertOne({ ...city, embedding })
    console.log(`✅ Seeded policy: ${city.city}`)
  }

  // Step 4: Seed preferred vendors + 2dsphere index
  await db.collection("preferred_vendors").deleteMany({})
  await db.collection("preferred_vendors").insertMany(preferredVendors.vendors)
  await db.collection("preferred_vendors").createIndex({ location: "2dsphere" })
  console.log("✅ Seeded preferred vendors + 2dsphere index")

  // Step 5: Seed visa requirements
  await db.collection("visa_requirements").deleteMany({})
  await db.collection("visa_requirements").insertMany(visaRequirements.requirements)
  await db.collection("visa_requirements").createIndex({ destinationCountry: 1, citizenship: 1 })
  console.log("✅ Seeded visa requirements")

  // Step 6: Seed demo trip (Kelli → Milan, draft)
  await db.collection("trips").deleteMany({ userId: kelliId })
  await db.collection("trips").insertOne({
    userId: kelliId,
    status: "draft",
    destination: { city: "Milan", country: "IT", officeLat: 45.4654, officeLng: 9.1866 },
    dates: { departure: new Date("2025-09-14"), return: new Date("2025-09-19") },
    selectedBundle: null,
    flights: [],
    hotels: [],
    receipts: [],
    policyFindings: null,
    approvalThread: { gmailThreadId: null, status: null, reason: null },
    totalSpendUsd: Decimal128.fromString("0"),
    budgetCapUsd: Decimal128.fromString("2800"),
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  console.log("✅ Seeded demo trip for Kelli → Milan")

  // Step 7: Seed demo alternative flights for crisis rebooking (Frame 10-11)
  await db.collection("demo_alternatives").deleteMany({})
  await db.collection("demo_alternatives").insertMany([
    {
      destinationCountry: "IT",
      flightNumber: "LH1234",
      carrier: "Lufthansa",
      origin: "MCI",
      destination: "MXP",
      departureTime: "2025-09-14T14:30:00.000Z",
      arrivalTime: "2025-09-15T08:15:00.000Z",
      priceUsd: 1480,
    },
    {
      destinationCountry: "GB",
      flightNumber: "BA4567",
      carrier: "British Airways",
      origin: "MCI",
      destination: "LHR",
      departureTime: "2025-09-14T16:00:00.000Z",
      arrivalTime: "2025-09-15T07:30:00.000Z",
      priceUsd: 1320,
    },
    {
      destinationCountry: "FR",
      flightNumber: "AF8901",
      carrier: "Air France",
      origin: "MCI",
      destination: "CDG",
      departureTime: "2025-09-14T15:45:00.000Z",
      arrivalTime: "2025-09-15T09:00:00.000Z",
      priceUsd: 1260,
    },
  ])
  console.log("✅ Seeded demo alternative flights for crisis rebooking")

  await client.close()
  console.log("🎉 Seeding complete!")
}

export { main }

if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error("❌ Seeding failed:", err)
    process.exit(1)
  })
}
