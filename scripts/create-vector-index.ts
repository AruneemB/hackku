// ============================================================
// SCRIPT: Create Atlas Vector Search Index
// OWNER: Track C (Data & Integrations)
// USAGE: npx ts-node scripts/create-vector-index.ts
//
// WHAT THIS DOES:
//   Creates a Vector Search index on the `policies` collection
//   for the `embedding` field. Must be run AFTER seeding the
//   policies collection with Gemini embeddings.
//
//   NOTE: Atlas Vector Search indexes can also be created
//   manually in the Atlas UI:
//   Atlas → Browse Collections → policies → Search Indexes → Create
//
// INDEX CONFIGURATION:
//   Name:       policy_vector_index
//   Collection: policies
//   Field:      embedding
//   Type:       vector
//   Dimensions: 768    ← must match Gemini text-embedding-004
//   Similarity: cosine
//
// ENV REQUIRED: MONGODB_URI (must have Atlas admin privileges)
// ============================================================

// TODO: import { MongoClient } from "mongodb"

// TODO: async function main() {
//   const client = new MongoClient(process.env.MONGODB_URI!)
//   await client.connect()
//   const db = client.db("hackku")
//
//   // Atlas Vector Search indexes are managed through the Atlas Search API
//   // The createSearchIndex command is available in MongoDB 7.0+ Atlas clusters
//   // await db.collection("policies").createSearchIndex({
//   //   name: "policy_vector_index",
//   //   type: "vectorSearch",
//   //   definition: {
//   //     fields: [{
//   //       type: "vector",
//   //       path: "embedding",
//   //       numDimensions: 768,
//   //       similarity: "cosine"
//   //     }]
//   //   }
//   // })
//
//   // ALTERNATIVE: Use Atlas CLI
//   // atlas clusters search indexes create \
//   //   --clusterName <your-cluster> \
//   //   --file scripts/vector-index-definition.json
//
//   // ALTERNATIVE: Atlas UI (recommended for hackathon speed)
//   // 1. Go to Atlas → Browse Collections → policies
//   // 2. Click "Search Indexes" tab
//   // 3. Click "Create Search Index"
//   // 4. Select "JSON Editor"
//   // 5. Paste:
//   // {
//   //   "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" }]
//   // }
//
//   console.log("✅ Vector Search index created on policies.embedding")
//   await client.close()
// }

// main().catch(console.error)
