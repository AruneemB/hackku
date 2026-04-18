import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
export const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" })

export function getGeminiChat(systemPrompt?: string) {
  return geminiModel.startChat({ systemInstruction: systemPrompt })
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text)
  return result.embedding.values
}
