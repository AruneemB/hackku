import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongod: MongoMemoryServer;

export async function connect() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

export async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

export async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

// Global hooks for model tests (optional, can be imported per test)
export const setupMongo = () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());
};
