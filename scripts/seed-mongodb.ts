// ============================================================
// SCRIPT: Seed MongoDB Atlas
// OWNER: Track C (Data & Integrations)
// USAGE: npx ts-node scripts/seed-mongodb.ts
//   (or add to package.json: "seed": "ts-node scripts/seed-mongodb.ts")
//
// WHAT THIS DOES:
//   1. Connects to MongoDB Atlas using MONGODB_URI
//   2. Creates the `flight_status` TimeSeries collection (if not exists)
//   3. Seeds `users` with Kelli Thompson + manager
//   4. Seeds `policies` with 6 cities — runs Gemini to generate embeddings
//   5. Seeds `preferred_vendors` with GeoJSON hotel locations
//   6. Seeds `visa_requirements` with 6 demo countries
//   7. Seeds a demo `trip` in "draft" status for Kelli
//
// ENV REQUIRED: MONGODB_URI, GEMINI_API_KEY
//
// RUN ONCE before starting the app for the first time.
// Safe to re-run — drops and recreates all collections.
// ============================================================

// TODO: import { MongoClient, Decimal128 } from "mongodb"
// TODO: import { generateEmbedding } from "@/lib/gemini/client"
// TODO: import budgetCaps from "../data/policy/budget-caps.json"
// TODO: import preferredVendors from "../data/vendors/preferred-vendors.json"
// TODO: import visaRequirements from "../data/visa/visa-requirements.json"

// TODO: async function main() {
//   const client = new MongoClient(process.env.MONGODB_URI!)
//   await client.connect()
//   const db = client.db("hackku")
//
//   // Step 1: Create TimeSeries collection
//   // try {
//   //   await db.createCollection("flight_status", {
//   //     timeseries: { timeField: "timestamp", metaField: "metadata", granularity: "minutes" }
//   //   })
//   //   console.log("✅ flight_status TimeSeries collection created")
//   // } catch (e) { console.log("ℹ️ flight_status already exists") }
//
//   // Step 2: Seed users
//   // await db.collection("users").deleteMany({})
//   // const kelliId = new ObjectId()
//   // const managerId = new ObjectId()
//   // await db.collection("users").insertMany([
//   //   { _id: kelliId, name: "Kelli Thompson", email: "kelli.thompson@lockton.com",
//   //     citizenship: "US", passport: { number: "XXXXXXXXX",
//   //     expiry: new Date("2026-03-15"),  ← intentionally expiring soon!
//   //     country: "US" }, department: "Risk Management", managerId, homeAirports: ["MCI"] },
//   //   { _id: managerId, name: "James Walker", email: "j.walker@lockton.com",
//   //     citizenship: "US", passport: { expiry: new Date("2028-06-01"), country: "US" },
//   //     department: "Management", managerId: null, homeAirports: ["MCI"] }
//   // ])
//
//   // Step 3: Seed policies with embeddings
//   // await db.collection("policies").deleteMany({})
//   // for (const city of budgetCaps.cities) {
//   //   const embedding = await generateEmbedding(city.handbookExcerpt)
//   //   await db.collection("policies").insertOne({ ...city, embedding })
//   //   console.log(`✅ Seeded policy: ${city.city}`)
//   // }
//
//   // Step 4: Seed preferred vendors
//   // await db.collection("preferred_vendors").deleteMany({})
//   // await db.collection("preferred_vendors").insertMany(preferredVendors.vendors)
//   // await db.collection("preferred_vendors").createIndex({ location: "2dsphere" })
//   // console.log("✅ Seeded preferred vendors + 2dsphere index")
//
//   // Step 5: Seed visa requirements
//   // await db.collection("visa_requirements").deleteMany({})
//   // await db.collection("visa_requirements").insertMany(visaRequirements.requirements)
//   // console.log("✅ Seeded visa requirements")
//
//   // Step 6: Seed demo trip
//   // await db.collection("trips").deleteMany({ userId: kelliId })
//   // await db.collection("trips").insertOne({
//   //   userId: kelliId, status: "draft",
//   //   destination: { city: "Milan", country: "IT", officeLat: 45.4654, officeLng: 9.1866 },
//   //   dates: { departure: new Date("2025-09-14"), return: new Date("2025-09-19") },
//   //   selectedBundle: null, flights: [], hotels: [], receipts: [],
//   //   policyFindings: null,
//   //   approvalThread: { gmailThreadId: null, status: null, reason: null },
//   //   totalSpend: Decimal128.fromString("0"), budgetCap: Decimal128.fromString("2800"),
//   //   createdAt: new Date(), updatedAt: new Date()
//   // })
//   // console.log("✅ Seeded demo trip for Kelli → Milan")
//
//   await client.close()
//   console.log("🎉 Seeding complete!")
// }

// main().catch(console.error)
