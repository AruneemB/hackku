// ============================================================
// LIB: MongoDB Client (Singleton)
// OWNER: Track C (Data & Integrations)
// DESCRIPTION: Exports a single MongoClient promise that is
//   reused across all API routes in the Next.js server runtime.
//   Next.js hot-reload would create multiple connections without
//   the global cache pattern below.
//
// USAGE:
//   import clientPromise from "@/lib/mongodb/client";
//   const client = await clientPromise;
//   const db = client.db("hackku");
//   const trips = db.collection("trips");
//
// ENV REQUIRED: MONGODB_URI (Atlas connection string)
// ============================================================

// TODO: import MongoClient from "mongodb"
// TODO: declare global { var _mongoClientPromise: Promise<MongoClient> }
// TODO: if (!global._mongoClientPromise) create new MongoClient(uri)
// TODO: export default global._mongoClientPromise
