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

import clientPromise, { connectToDatabase } from "@/lib/mongodb/client";
import { generateEmbedding, geminiModel } from "@/lib/gemini/client";
import { buildPolicySummaryPrompt } from "@/lib/gemini/prompts";
import { Trip } from "@/types/trip";
import { Policy, PolicyFindings, VisaRequirement as VisaRequirementType } from "@/types/policy";
import User from "@/lib/mongodb/models/User";
import VisaRequirement from "@/lib/mongodb/models/VisaRequirement";

export async function queryPolicyForTrip(
  trip: Trip, 
  costs?: { flightCostUsd?: number; hotelNightlyRateUsd?: number }
): Promise<PolicyFindings> {
  // Step 1: Generate query embedding
  const query = `travel policy budget rules for ${trip.destination.city} ${trip.destination.country}`
  const embedding = await generateEmbedding(query)

  // Step 2: Atlas Vector Search
  const client = await clientPromise;
  const db = client.db("hackku")
  const results = await db.collection("policies").aggregate([
    {
      $vectorSearch: {
        index: "policy_vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: 10,
        limit: 1
      }
    },
    {
      $project: { embedding: 0 }
    }
  ]).toArray()

  if (results.length === 0) {
    throw new Error(`No policy found for ${trip.destination.city}, ${trip.destination.country}`);
  }

  const policyDoc = results[0] as unknown as Policy;

  // Step 3: Fetch Visa Requirements
  await connectToDatabase();
  const user = await User.findById(trip.userId);
  if (!user) {
    throw new Error(`User not found: ${trip.userId}`);
  }

  const visaInfo = await VisaRequirement.findOne({
    destinationCountry: trip.destination.country,
    citizenship: user.citizenship
  });

  if (!visaInfo) {
    throw new Error(`Visa requirements not found for ${user.citizenship} to ${trip.destination.country}`);
  }

  // Step 4: Gemini synthesizes findings
  const prompt = buildPolicySummaryPrompt(policyDoc, trip, visaInfo.toObject(), costs)
  const result = await geminiModel.generateContent(prompt)
  const responseText = result.response.text()

  // Clean up JSON response if wrapped in markdown
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse PolicyFindings from Gemini response");
  }

  try {
    const findings = JSON.parse(jsonMatch[0]) as PolicyFindings;
    // Ensure the visa field is the full record from our DB
    findings.visa = visaInfo.toObject() as unknown as VisaRequirementType;
    return findings;
  } catch (error) {
    console.error("Error parsing PolicyFindings JSON:", error);
    throw new Error("Invalid PolicyFindings JSON returned from Gemini");
  }
}
