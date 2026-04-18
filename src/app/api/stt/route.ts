import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(req: NextRequest) {
  const { audio, mimeType } = (await req.json()) as { audio: string; mimeType: string };

  if (!audio) {
    return NextResponse.json({ error: "No audio data" }, { status: 400 });
  }

  const audioMime = (mimeType || "audio/webm").split(";")[0];

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: audioMime,
          data: audio,
        },
      },
      "Transcribe this audio exactly as the person said it. Return only the spoken words — no labels, no punctuation edits, no commentary. If inaudible or empty, return an empty string.",
    ]);

    const text = result.response.text().trim();
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[stt] error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
