// ============================================================
// MODEL: FlightStatus (TimeSeries Collection)
// OWNER: Track C (Data & Integrations)
// COLLECTION: flight_status   ← must be created as TimeSeries!
// DESCRIPTION: Stores live flight status updates for Frame 9-11.
//   This is NOT a regular Mongoose model — TimeSeries collections
//   must be created explicitly in MongoDB with createCollection().
//   See scripts/seed-mongodb.ts for the creation command.
//
// TIMESERIES CONFIG:
//   timeField: "timestamp"
//   metaField: "metadata"
//   granularity: "minutes"
//
// QUERIED BY: src/hooks/useFlightStatus.ts (polls /api/flights/live)
//
// EXAMPLE DOC → see src/types/flight.ts → FlightStatusUpdate
// ============================================================

import clientPromise from "@/lib/mongodb/client";
import type { FlightStatusUpdate } from "@/types";

/**
 * Inserts a new flight status update into the flight_status TimeSeries collection.
 * Maps flightNumber and tripId into the metadata field for TimeSeries optimization.
 */
export async function writeFlightStatus(update: Partial<FlightStatusUpdate>) {
  const client = await clientPromise;
  const db = client.db("hackku");

  const { flightNumber, tripId, timestamp, ...rest } = update;

  // TimeSeries collections require a timestamp field
  const statusDoc = {
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    metadata: {
      flightNumber: flightNumber || "UNKNOWN",
      tripId: tripId || null,
    },
    ...rest,
  };

  await db.collection("flight_status").insertOne(statusDoc);
}

/**
 * Returns the most recent flight status document for a given flight number.
 * Queries by metadata.flightNumber and sorts by timestamp descending.
 */
export async function getLatestFlightStatus(flightNumber: string): Promise<FlightStatusUpdate | null> {
  const client = await clientPromise;
  const db = client.db("hackku");

  const doc = await db.collection("flight_status")
    .find({ "metadata.flightNumber": flightNumber })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray();

  if (!doc || doc.length === 0) {
    return null;
  }

  const { metadata, timestamp, _id, ...rest } = doc[0];

  const flightNum = metadata?.flightNumber;
  const tripId = metadata?.tripId;

  // Required fields must be present; status/gate/delayMinutes/destination come from ...rest
  if (
    typeof flightNum !== "string" ||
    typeof tripId !== "string" ||
    typeof rest.status !== "string" ||
    typeof rest.delayMinutes !== "number" ||
    typeof rest.destination !== "string"
  ) {
    return null;
  }

  return {
    timestamp: new Date(timestamp),
    flightNumber: flightNum,
    tripId,
    status: rest.status as FlightStatusUpdate["status"],
    gate: typeof rest.gate === "string" ? rest.gate : null,
    delayMinutes: rest.delayMinutes,
    destination: rest.destination,
  };
}
