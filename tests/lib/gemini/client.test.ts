import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any imports of the module under test
// ---------------------------------------------------------------------------
const { mockStartChat, mockEmbedContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockStartChat = vi.fn().mockReturnValue({ sendMessage: vi.fn() })
  const mockEmbedContent = vi.fn().mockResolvedValue({
    embedding: { values: [0.1, -0.2, 0.3, 0.0] },
  })
  const mockGetGenerativeModel = vi.fn().mockImplementation(({ model }: { model: string }) => {
    if (model.includes("embedding")) return { embedContent: mockEmbedContent }
    return { startChat: mockStartChat }
  })
  return { mockStartChat, mockEmbedContent, mockGetGenerativeModel }
})

vi.mock("@google/generative-ai", () => ({
  // Must use a regular function — arrow functions cannot be called with `new`
  GoogleGenerativeAI: vi.fn().mockImplementation(function () {
    return { getGenerativeModel: mockGetGenerativeModel }
  }),
}))

// Import AFTER mocks are registered
import {
  geminiModel,
  embeddingModel,
  getGeminiChat,
  generateEmbedding,
} from "../../../src/lib/gemini/client"

// ---------------------------------------------------------------------------

describe("Gemini client — model initialization", () => {
  it("initializes geminiModel with gemini-1.5-pro", () => {
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: "gemini-1.5-pro" })
    expect(geminiModel).toBeDefined()
  })

  it("initializes embeddingModel with gemini-embedding-001", () => {
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: "gemini-embedding-001" })
    expect(embeddingModel).toBeDefined()
  })

  it("creates exactly two model instances", () => {
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2)
  })
})

// ---------------------------------------------------------------------------

describe("getGeminiChat", () => {
  beforeEach(() => {
    mockStartChat.mockClear()
  })

  it("starts a chat session without a system prompt", () => {
    const chat = getGeminiChat()
    expect(mockStartChat).toHaveBeenCalledOnce()
    expect(mockStartChat).toHaveBeenCalledWith({ systemInstruction: undefined })
    expect(chat).toBeDefined()
  })

  it("passes systemInstruction when a prompt is provided", () => {
    const prompt = "You are a corporate travel concierge."
    getGeminiChat(prompt)
    expect(mockStartChat).toHaveBeenCalledWith({ systemInstruction: prompt })
  })

  it("returns the chat object from startChat", () => {
    const expected = { sendMessage: vi.fn() }
    mockStartChat.mockReturnValueOnce(expected)
    const result = getGeminiChat()
    expect(result).toBe(expected)
  })

  it("creates independent sessions on successive calls", () => {
    getGeminiChat("prompt A")
    getGeminiChat("prompt B")
    expect(mockStartChat).toHaveBeenCalledTimes(2)
    expect(mockStartChat).toHaveBeenNthCalledWith(1, { systemInstruction: "prompt A" })
    expect(mockStartChat).toHaveBeenNthCalledWith(2, { systemInstruction: "prompt B" })
  })
})

// ---------------------------------------------------------------------------

describe("generateEmbedding", () => {
  beforeEach(() => {
    mockEmbedContent.mockClear()
  })

  it("calls embedContent with the provided text", async () => {
    await generateEmbedding("Milan travel policy")
    expect(mockEmbedContent).toHaveBeenCalledOnce()
    expect(mockEmbedContent).toHaveBeenCalledWith({
      content: { parts: [{ text: "Milan travel policy" }], role: "user" },
    })
  })

  it("returns the values array from the embedding response", async () => {
    const values = new Array(768).fill(0.1)
    mockEmbedContent.mockResolvedValueOnce({ embedding: { values } })
    const result = await generateEmbedding("any text")
    expect(result).toEqual(values)
  })

  it("returns a non-empty array of numbers", async () => {
    const result = await generateEmbedding("test")
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((v) => typeof v === "number")).toBe(true)
  })

  it("propagates API errors to the caller", async () => {
    const apiError = new Error("API quota exceeded")
    mockEmbedContent.mockRejectedValueOnce(apiError)
    await expect(generateEmbedding("text")).rejects.toThrow("API quota exceeded")
  })

  it("handles embeddings with 768 values (requested dimension)", async () => {
    const vec = new Array(768).fill(0).map((_, i) => i / 768)
    mockEmbedContent.mockResolvedValueOnce({ embedding: { values: vec } })
    const result = await generateEmbedding("policy text")
    expect(result).toHaveLength(768)
  })
})
