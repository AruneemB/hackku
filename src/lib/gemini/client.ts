// ============================================================
// LIB: Gemini AI Client
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Initializes the Google Generative AI client using
//   the GEMINI_API_KEY env var. Exports helper functions for
//   starting chat sessions and generating embeddings.
//
//   Model used: gemini-1.5-pro (supports text + vision)
//   Embedding model: text-embedding-004 (768 dimensions)
//     → must match Atlas Vector Search index dimension!
//
// ENV REQUIRED: GEMINI_API_KEY
//
// USAGE:
//   import { getGeminiChat, generateEmbedding } from "@/lib/gemini/client"
//   const chat = getGeminiChat()
//   const response = await chat.sendMessage("What is the Milan hotel cap?")
// ============================================================

// TODO: import { GoogleGenerativeAI } from "@google/generative-ai"
// TODO: const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
// TODO: export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
// TODO: export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
//
// TODO: export function getGeminiChat(systemPrompt?: string) {
//   // Returns a new chat session with optional system instruction
//   // return geminiModel.startChat({ systemInstruction: systemPrompt })
// }
//
// TODO: export async function generateEmbedding(text: string): Promise<number[]> {
//   // Used by scripts/seed-mongodb.ts to embed policy handbook excerpts
//   // and by lib/policy/vectorSearch.ts to embed the user's query
//   // EXAMPLE RETURN: [0.012, -0.345, 0.789, ...] (768 floats)
// }
