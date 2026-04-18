// ============================================================
// SCRIPT: Create Atlas Vector Search Index
// OWNER: Track C (Data & Integrations)
// USAGE: npx tsx scripts/create-vector-index.ts
//
// WHAT THIS DOES:
//   Creates a Vector Search index on the `policies` collection
//   for the `embedding` field. Must be run AFTER seeding the
//   policies collection with Gemini embeddings.
//
// ENV REQUIRED: MONGODB_URI (must have Atlas admin privileges)
//
// ⚠️  MANUAL FALLBACK (ATLAS UI):
// If this script fails (e.g., driver version issues or free-tier cluster limits):
// 1. Log in to MongoDB Atlas UI
// 2. Go to "Database" -> "Browse Collections" -> "hackku" -> "policies"
// 3. Select the "Atlas Search" or "Vector Search" tab
// 4. Click "Create Search Index" -> "JSON Editor"
// 5. Select the `hackku.policies` collection
// 6. Set Index Name to "policy_vector_index"
// 7. Use the following JSON configuration:
//    {
//      "fields": [
//        {
//          "type": "vector",
//          "path": "embedding",
//          "numDimensions": 768,
//          "similarity": "cosine"
//        }
//      ]
//    }
// 8. Click "Create Search Index" and wait for it to build.
// ============================================================

import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const client = new MongoClient(uri);
  await client.connect();
  console.log("✅ Connected to MongoDB Atlas");

  const db = client.db("hackku");
  const collection = db.collection("policies");

  console.log("Creating Atlas Vector Search index: policy_vector_index...");

  try {
    // Atlas Vector Search indexes are managed through the Atlas Search API
    // The createSearchIndex command is available in MongoDB 7.0+ Atlas clusters
    await collection.createSearchIndex({
      name: "policy_vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            type: "vector",
            path: "embedding",
            numDimensions: 768,
            similarity: "cosine",
          },
        ],
      },
    });

    console.log("✅ Vector Search index 'policy_vector_index' creation command sent.");
    console.log("ℹ️ Note: Index creation may take a few minutes to become active in Atlas.");
  } catch (error: any) {
    if (error.codeName === "IndexAlreadyExists" || error.message?.includes("already exists")) {
      console.log("ℹ️ Index 'policy_vector_index' already exists — skipping");
    } else {
      console.error("❌ Failed to create Vector Search index:", error);
      // In some environments (like local or non-Atlas), this command will fail.
      // We'll swallow the error if it's not an Atlas cluster, but log a warning.
      console.warn("⚠️  Make sure you are running this against a MongoDB Atlas cluster (v7.0+).");
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
