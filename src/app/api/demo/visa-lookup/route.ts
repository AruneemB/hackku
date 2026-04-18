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

const GEMINI_TIMEOUT_MS = 25_000;

const ISO_ALPHA2 = /^[A-Za-z]{2}$/;

function normalizeCountryToAlpha2(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!ISO_ALPHA2.test(t)) return null;
  return t.toUpperCase();
}

function getCountryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function isNullOrHttpsUrl(value: string | null): boolean {
  if (value === null || value === "") return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

type VisaLookupPayload = {
  visaRequired: boolean;
  visaType: string | null;
  stayLimitDays: number;
  notes: string;
  applicationUrl: string | null;
  minApplicationLeadDays: number | null;
};

function validateVisaPayload(parsed: unknown): { ok: true; data: VisaLookupPayload } | { ok: false; message: string } {
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, message: "Response must be a JSON object" };
  }
  const o = parsed as Record<string, unknown>;

  if (typeof o.visaRequired !== "boolean") {
    return { ok: false, message: "visaRequired must be a boolean" };
  }

  if (o.visaType !== null && typeof o.visaType !== "string") {
    return { ok: false, message: "visaType must be a string or null" };
  }

  if (typeof o.stayLimitDays !== "number" || !Number.isFinite(o.stayLimitDays) || o.stayLimitDays < 0) {
    return { ok: false, message: "stayLimitDays must be a non-negative number" };
  }

  if (typeof o.notes !== "string") {
    return { ok: false, message: "notes must be a string" };
  }

  let applicationUrl: string | null;
  if (o.applicationUrl === null || o.applicationUrl === undefined || o.applicationUrl === "") {
    applicationUrl = null;
  } else if (typeof o.applicationUrl === "string") {
    if (!isNullOrHttpsUrl(o.applicationUrl)) {
      return { ok: false, message: "applicationUrl must be null, empty, or an https URL" };
    }
    applicationUrl = o.applicationUrl;
  } else {
    return { ok: false, message: "applicationUrl must be a string or null" };
  }

  let minApplicationLeadDays: number | null;
  if (o.minApplicationLeadDays === null || o.minApplicationLeadDays === undefined) {
    minApplicationLeadDays = null;
  } else if (
    typeof o.minApplicationLeadDays === "number" &&
    Number.isFinite(o.minApplicationLeadDays) &&
    Number.isInteger(o.minApplicationLeadDays) &&
    o.minApplicationLeadDays >= 0
  ) {
    minApplicationLeadDays = o.minApplicationLeadDays;
  } else {
    return { ok: false, message: "minApplicationLeadDays must be null or a non-negative integer" };
  }

  return {
    ok: true,
    data: {
      visaRequired: o.visaRequired,
      visaType: o.visaType as string | null,
      stayLimitDays: o.stayLimitDays,
      notes: o.notes,
      applicationUrl,
      minApplicationLeadDays,
    },
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      },
    );
  });
}

export async function POST(req: NextRequest) {
  let body: { country: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normalizedCountry = normalizeCountryToAlpha2(body.country);
  if (!normalizedCountry) {
    return NextResponse.json({ error: "country must be an ISO 3166-1 alpha-2 code" }, { status: 400 });
  }

  const countryName = getCountryName(normalizedCountry);

  const prompt = `You are an authoritative travel compliance system. Return accurate visa requirements for US citizens (passport holders) visiting ${countryName} (ISO code: ${normalizedCountry}) for a short business trip (under 30 days).

Rules:
- visaRequired: true only if a visa or pre-travel authorization is required before boarding (ETAs, eVisas, and EVTAs count as required)
- visaType: the exact official name of the required document, or null if none needed
- stayLimitDays: maximum consecutive days allowed per visit without a long-stay visa
- notes: one concise sentence summarizing entry rules for US citizens
- applicationUrl: the official government or embassy URL to apply, or null if not applicable
- minApplicationLeadDays: minimum recommended days before departure to apply, or null if not applicable

Return only the JSON object. Be accurate — this is used for business travel compliance.`;

  try {
    const result = await withTimeout(model.generateContent(prompt), GEMINI_TIMEOUT_MS);
    const text = result.response.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 502 });
    }

    const validated = validateVisaPayload(parsed);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 });
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    if (err instanceof Error && err.message === "GEMINI_TIMEOUT") {
      return NextResponse.json({ error: "Visa lookup timed out" }, { status: 504 });
    }
    console.error("visa-lookup Gemini error:", err);
    return NextResponse.json({ error: "Failed to retrieve visa requirements" }, { status: 500 });
  }
}
