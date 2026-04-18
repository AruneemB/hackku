import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { audio, mimeType } = (await req.json()) as { audio: string; mimeType: string };

  if (!audio) {
    return NextResponse.json({ error: "No audio data" }, { status: 400 });
  }

  const audioMime = (mimeType || "audio/webm").split(";")[0];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Kelli Travel Concierge",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${audioMime};base64,${audio}`,
                },
              },
              {
                type: "text",
                text: "Transcribe this audio exactly as the person said it. Return only the spoken words — no labels, no punctuation edits, no commentary. If inaudible or empty, return an empty string.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[stt] OpenRouter error:", res.status, errText);
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[stt] error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
