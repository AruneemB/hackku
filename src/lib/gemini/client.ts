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

import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" })

export function getGeminiChat(systemPrompt?: string) {
  return geminiModel.startChat({ systemInstruction: systemPrompt })
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
