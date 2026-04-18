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
