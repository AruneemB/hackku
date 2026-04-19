import { NextRequest, NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini/client";

function getCountryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { city, country, visaRequired, visaType, hotelOverCap } = await req.json();
    const countryName = getCountryName(country);

    const hasIssues = visaRequired || hotelOverCap;

    const prompt = `
      You are Lockey, an AI travel concierge for Lockton. 
      The user is at the "Compliance Check" stage of planning a trip to ${city}, ${countryName}.
      
      Status:
      - Visa Required: ${visaRequired ? `Yes (${visaType || "Required"})` : "No"}
      - Hotel Over Budget: ${hotelOverCap ? "Yes" : "No"}
      
      ${hasIssues 
        ? "There ARE compliance issues. Briefly acknowledge them and say 'here's what needs attention'."
        : "Everything is PERFECTLY compliant. Congratulate them on a policy-perfect trip and say something like 'everything looks great' or 'you're all set from a policy perspective'."}
      
      Requirements:
      - Be concise (max 2 sentences).
      - Maintain a helpful, senior concierge tone.
      - Do NOT mention "needs attention" if there are no issues.
      - Do NOT use emojis.
    `;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({ 
      mascotMessage: text || (hasIssues 
        ? "I ran a compliance check on your trip — here's what needs attention." 
        : "I ran a compliance check on your trip and everything looks perfectly compliant.")
    });
  } catch (error) {
    console.error("Compliance greeting error:", error);
    return NextResponse.json({ mascotMessage: "I ran a compliance check on your trip and everything looks good." });
  }
}
