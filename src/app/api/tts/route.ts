import { NextRequest, NextResponse } from "next/server";
import { speak } from "@/lib/elevenlabs/client";
import type { ToneKey } from "@/lib/elevenlabs/tones";

export async function POST(req: NextRequest) {
  const { text, tone } = (await req.json()) as { text: string; tone: string };

  const speech = await speak(text, (tone as ToneKey) ?? "neutral");

  if (!speech) {
    return NextResponse.json({ error: "TTS unavailable" }, { status: 503 });
  }

  return NextResponse.json(
    {
      audioBase64: Buffer.from(speech.audio).toString("base64"),
      alignment: speech.alignment,
      normalizedAlignment: speech.normalizedAlignment,
    },
    { headers: { "Cache-Control": "no-cache" } }
  );
}
