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

// TimeSeries collections are created via db.createCollection(), not mongoose.model()
// This file exports helper functions for reading/writing to the collection.

// TODO: import clientPromise from "@/lib/mongodb/client"
//
// TODO: export async function writeFlightStatus(update: FlightStatusUpdate) {
//   // Insert a new status event into the TimeSeries collection
//   // const db = (await clientPromise).db("hackku")
//   // await db.collection("flight_status").insertOne({ timestamp: new Date(), ...update })
// }
//
// TODO: export async function getLatestFlightStatus(flightNumber: string) {
//   // Returns the most recent status doc for a flight
//   // EXAMPLE RETURN:
//   // {
//   //   "timestamp": "2025-09-14T15:30:00.000Z",
//   //   "metadata": { "flightNumber": "AA2345", "tripId": "665a2b3c..." },
//   //   "status": "delayed",
//   //   "gate": "B22",
//   //   "delayMinutes": 47
//   // }
// }
