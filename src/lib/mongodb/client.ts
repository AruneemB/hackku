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

import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri)
  global._mongoClientPromise = client.connect()
}

export default global._mongoClientPromise
