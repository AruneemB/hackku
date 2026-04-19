// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { speak } from "@/lib/elevenlabs/client";
import type { ToneKey } from "@/lib/elevenlabs/tones";

export async function POST(req: NextRequest) {
  const { text, tone } = (await req.json()) as { text: string; tone: string };

  const result = await speak(text, (tone as ToneKey) ?? "neutral");

  if (!result.ok) {
    return NextResponse.json(
      { error: "TTS unavailable", reason: result.reason, status: result.status, voiceId: result.voiceId },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      audioBase64: Buffer.from(result.speech.audio).toString("base64"),
      alignment: result.speech.alignment,
      normalizedAlignment: result.speech.normalizedAlignment,
      voiceId: result.voiceId,
    },
    { headers: { "Cache-Control": "no-cache" } }
  );
}
