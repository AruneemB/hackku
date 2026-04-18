// ============================================================
// LIB: Policy Vector Search (Frame 4)
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Performs Atlas Vector Search against the company
//   travel handbook to extract budget caps, approval rules, and
//   any policy flags relevant to the user's trip.
//
//   Flow:
//   1. Build a query string from the trip (e.g. "Milan hotel budget rules")
//   2. Embed the query with Gemini text-embedding-004
//   3. Run $vectorSearch against policies.embedding
//   4. Return the top matching policy document
//   5. Gemini synthesizes findings into PolicyFindings
//
//   Atlas Vector Search index must exist on policies collection
//   (created by scripts/create-vector-index.ts)
// ============================================================

// TODO: import clientPromise from "@/lib/mongodb/client"
// TODO: import { generateEmbedding } from "@/lib/gemini/client"
// TODO: import { geminiModel } from "@/lib/gemini/client"
// TODO: import { buildPolicySummaryPrompt } from "@/lib/gemini/prompts"

// TODO: export async function queryPolicyForTrip(trip: Trip): Promise<PolicyFindings> {
//   // Step 1: Generate query embedding
//   // const query = `travel policy budget rules for ${trip.destination.city} ${trip.destination.country}`
//   // const embedding = await generateEmbedding(query)
//
//   // Step 2: Atlas Vector Search
//   // const db = (await clientPromise).db("hackku")
//   // const results = await db.collection("policies").aggregate([
//   //   { $vectorSearch: {
//   //     index: "policy_vector_index",
//   //     path: "embedding",
//   //     queryVector: embedding,
//   //     numCandidates: 10,
//   //     limit: 1
//   //   }},
//   //   { $project: { embedding: 0 } }  // don't return the large embedding array
//   // ]).toArray()
//
//   // Step 3: Gemini synthesizes findings
//   // const policyDoc = results[0]
//   // const prompt = buildPolicySummaryPrompt(policyDoc, trip)
//   // const summary = await geminiModel.generateContent(prompt)
//
//   // EXAMPLE RETURN:
//   // {
//   //   "visa": { "destinationCountry": "IT", "visaRequired": false, "stayLimitDays": 90 },
//   //   "hotelNightlyCapUsd": 200, "flightCapUsd": 1500,
//   //   "requiresManagerApproval": true,
//   //   "approvalReason": "Hotel exceeds $200 Milan cap",
//   //   "mascotSummary": "No visa needed! But the hotel is $15 over cap — I'll need sign-off."
//   // }
// }
