import { NextRequest, NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini/client";

function getCountryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export async function POST(req: NextRequest) {
  let body: { city: string; country: string; visaRequired: boolean; visaType: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ mascotMessage: "I ran a compliance check — here's what I found." });
  }

  const { city, country, visaRequired, visaType } = body;
  const countryName = getCountryName(country);

  const visaPromptPart = visaRequired && visaType
    ? `The traveler needs a ${visaType} to enter ${countryName}. `
    : "";

  const prompt = `You are Lockey, a warm and empathetic AI travel concierge. You just ran a compliance check for a business trip to ${city}, ${countryName}. ${visaPromptPart}There is also a hotel that slightly exceeds the nightly budget cap and needs a quick manager sign-off. Write a single, friendly sentence (under 25 words) summarizing what you found. Be warm and direct. No em dashes, no filler phrases like "Great news", no leading salutation.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim().replace(/^Lockey:\s*/i, "").trim();
    return NextResponse.json({ mascotMessage: text || "I ran a compliance check on your trip — here's what needs attention." });
  } catch {
    return NextResponse.json({ mascotMessage: "I ran a compliance check on your trip — here's what needs attention." });
  }
}
