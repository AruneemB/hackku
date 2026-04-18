import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Kelli Travel Concierge",
  },
});

const CHAT_MODEL = "google/gemini-2.0-flash-001";
const EMBED_MODEL = "openai/text-embedding-3-small";

type GeminiInput =
  | string
  | {
      contents: { role: string; parts: { text: string }[] }[];
      generationConfig?: { responseMimeType?: string };
    };

function makeModel() {
  return {
    async generateContent(input: GeminiInput) {
      let prompt: string;
      let jsonMode = false;

      if (typeof input === "string") {
        prompt = input;
      } else {
        prompt = input.contents.flatMap((c) => c.parts.map((p) => p.text)).join("\n");
        jsonMode = input.generationConfig?.responseMimeType === "application/json";
      }

      const completion = await openrouter.chat.completions.create({
        model: CHAT_MODEL,
        messages: [{ role: "user", content: prompt }],
        ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
      });

      const text = completion.choices[0].message.content ?? "";
      return { response: { text: () => text } };
    },

    startChat(_opts?: unknown) {
      return null;
    },
  };
}

export const geminiModel = makeModel();
export const embeddingModel = null; // kept for import compatibility

export function getGeminiChat(_systemPrompt?: string) {
  return null;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await openrouter.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  });
  return result.data[0].embedding;
}
