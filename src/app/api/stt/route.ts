import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const ALLOWED_MIME_TYPES = new Set([
  "audio/webm", "audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg",
]);
const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const { audio, mimeType } = (await req.json()) as { audio: string; mimeType: string };

  if (typeof audio !== "string" || !audio) {
    return NextResponse.json({ error: "No audio data" }, { status: 400 });
  }

  const audioMime = (mimeType || "audio/webm").split(";")[0];
  if (!ALLOWED_MIME_TYPES.has(audioMime)) {
    return NextResponse.json({ error: "Unsupported audio type" }, { status: 400 });
  }

  const approxBytes = Math.ceil((audio.length * 3) / 4);
  if (approxBytes > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio payload too large" }, { status: 413 });
  }

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType: audioMime, data: audio } },
      "Transcribe this audio exactly as the person said it. Return only the spoken words — no labels, no punctuation edits, no commentary. If inaudible or empty, return an empty string.",
    ]);

    const text = result.response.text().trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[stt] error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
