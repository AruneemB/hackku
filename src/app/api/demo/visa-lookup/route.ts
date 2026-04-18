import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        visaRequired: { type: SchemaType.BOOLEAN },
        visaType: { type: SchemaType.STRING, nullable: true },
        stayLimitDays: { type: SchemaType.NUMBER },
        notes: { type: SchemaType.STRING },
        applicationUrl: { type: SchemaType.STRING, nullable: true },
        minApplicationLeadDays: { type: SchemaType.NUMBER, nullable: true },
      },
      required: ["visaRequired", "visaType", "stayLimitDays", "notes", "applicationUrl", "minApplicationLeadDays"],
    },
  },
});

function getCountryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export async function POST(req: NextRequest) {
  let body: { country: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { country } = body;
  if (!country || typeof country !== "string") {
    return NextResponse.json({ error: "country is required" }, { status: 400 });
  }

  const countryName = getCountryName(country);

  const prompt = `You are an authoritative travel compliance system. Return accurate visa requirements for US citizens (passport holders) visiting ${countryName} (ISO code: ${country}) for a short business trip (under 30 days).

Rules:
- visaRequired: true only if a visa or pre-travel authorization is required before boarding (ETAs, eVisas, and EVTAs count as required)
- visaType: the exact official name of the required document, or null if none needed
- stayLimitDays: maximum consecutive days allowed per visit without a long-stay visa
- notes: one concise sentence summarizing entry rules for US citizens
- applicationUrl: the official government or embassy URL to apply, or null if not applicable
- minApplicationLeadDays: minimum recommended days before departure to apply, or null if not applicable

Return only the JSON object. Be accurate — this is used for business travel compliance.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as {
      visaRequired: boolean;
      visaType: string | null;
      stayLimitDays: number;
      notes: string;
      applicationUrl: string | null;
      minApplicationLeadDays: number | null;
    };
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("visa-lookup Gemini error:", err);
    return NextResponse.json({ error: "Failed to retrieve visa requirements" }, { status: 500 });
  }
}
