import { NextRequest, NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini/client";
import type { ToneKey } from "@/lib/elevenlabs/tones";

type ConversationMessage = { role: "user" | "assistant"; content: string };
type FieldKey = "city" | "country" | "originCity" | "departure" | "return" | "passportExpiry" | "purpose";
type KnownFields = Partial<Record<FieldKey, string>>;

const REQUIRED_FIELDS: FieldKey[] = [
  "city",
  "country",
  "originCity",
  "departure",
  "return",
  "passportExpiry",
  "purpose",
];

function sanitizeKnownFields(fields: KnownFields): KnownFields {
  const sanitized: KnownFields = {};

  for (const key of REQUIRED_FIELDS) {
    const raw = fields[key];
    if (!raw) continue;

    const value = raw.trim();
    if (!value || value.toLowerCase() === "null") continue;

    sanitized[key] = key === "country" ? value.toUpperCase() : value;
  }

  return sanitized;
}

function getOrdinalSuffix(i: number): string {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

function formatDateForSpeech(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(date.getTime())) {
        const month = date.toLocaleDateString("en-US", { month: "long" });
        const day = date.getDate();
        return `${month} ${day}${getOrdinalSuffix(day)}, ${date.getFullYear()}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function getCountryName(code: string): string {
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}

function describeTripBasics(known: KnownFields): string {
  const countryName = known.country ? getCountryName(known.country) : "";
  const destination =
    known.city && countryName
      ? `${known.city}, ${countryName}`
      : known.city ?? "";

  const fullRoute = known.originCity ? `${known.originCity} to ${destination}` : destination;

  if (destination && known.departure && known.return) {
    const dep = formatDateForSpeech(known.departure);
    const ret = formatDateForSpeech(known.return);
    return `I have ${fullRoute} from ${dep} to ${ret}.`;
  }

  if (destination) {
    return `I have ${fullRoute}.`;
  }

  return "";
}

function getPassportHeadsUp(known: KnownFields): string | null {
  if (!known.passportExpiry || !known.departure) return null;

  const expiry = new Date(known.passportExpiry);
  const threshold = new Date(known.departure);
  threshold.setMonth(threshold.getMonth() - 6);

  return expiry <= threshold
    ? "One quick heads-up: your passport expires within 6 months of departure, so you will want to renew it."
    : null;
}

function buildFrameZeroReply(known: KnownFields) {
  const summary = describeTripBasics(known);
  const passportHeadsUp = getPassportHeadsUp(known);

  if (!known.city || !known.country) {
    return {
      mascotMessage: "Where are you headed for this trip?",
      extractedData: null,
      isComplete: false,
    };
  }

  if (!known.departure && !known.return) {
    return {
      mascotMessage: "Got it. What are your departure and return dates?",
      extractedData: null,
      isComplete: false,
    };
  }

  if (!known.departure) {
    return {
      mascotMessage: "Got it. I still need your departure date. What day are you leaving?",
      extractedData: null,
      isComplete: false,
    };
  }

  if (!known.return) {
    return {
      mascotMessage: "Got it. I still need your return date. What day are you coming back?",
      extractedData: null,
      isComplete: false,
    };
  }

  if (!known.originCity) {
    return {
      mascotMessage: `${summary} Which city are you flying from?`.trim(),
      extractedData: null,
      isComplete: false,
    };
  }

  if (!known.passportExpiry) {
    return {
      mascotMessage: "What date does your passport expire?",
      extractedData: null,
      isComplete: false,
    };
  }

  if (!known.purpose) {
    const prefix = passportHeadsUp ? `${passportHeadsUp} ` : "";
    return {
      mascotMessage: `${prefix}What is the purpose of the trip?`.trim(),
      extractedData: null,
      isComplete: false,
    };
  }

  const closing = passportHeadsUp
    ? `${summary} ${passportHeadsUp} You are all set. I have everything I need to build the trip.`
    : `${summary} Perfect. I have everything I need to build the trip.`;

  return {
    mascotMessage: closing,
    extractedData: known as Record<FieldKey, string>,
    isComplete: true,
  };
}

function buildFrameSystem(frameIndex: number): string {
  const ctx: Record<number, string> = {
    2: "The traveler is picking from flight options. Help them choose fast and highlight the best value or speed.",
    3: "The traveler is picking a hotel near the client office. Help them decide quickly.",
    4: "The traveler is reviewing a compliance report flagging a visa requirement and a hotel budget exception. Keep it clear.",
    5: "The traveler is choosing a travel bundle. A is fully compliant, B saves money, C is strategic. Be decisive and helpful.",
    6: "The traveler is reviewing the approval email draft. Offer any last tweaks.",
    7: "The manager rejected the hotel. A compliant lower-cost alternative is on screen. Make the pivot feel easy.",
    8: "The trip is approved. The traveler is running through their pre-travel checklist. Keep the energy high.",
    9: "Live travel mode with real-time flight, weather, and hotel status. Keep them informed and calm.",
    10: "A thunderstorm caused a disruption and rebooking happened automatically. Reassure the traveler it is handled.",
    11: "The only rebooking option is over budget. An emergency exception email is ready. Make the next step obvious.",
    12: "The traveler just landed and is picking transport to the hotel. Give a quick helpful nudge.",
    13: "The traveler is snapping a restaurant receipt for expenses. Make it feel effortless.",
    14: "Emergency contacts are on screen. Be calm and reassuring.",
    15: "The trip is wrapping up and final spend is summarized. End on a positive note.",
    16: "The trip is archived. Close it out with warmth.",
  };
  const description = ctx[frameIndex] ?? "The traveler is interacting with their AI travel concierge.";
  return `You are Lockey, a warm and energetic AI travel concierge. ${description} Reply in 1 to 2 sentences. Be helpful, friendly, and direct. No filler phrases and no em dashes.`;
}

async function extractFrameZeroKnownFields(
  messages: ConversationMessage[],
  incomingKnown: KnownFields
): Promise<KnownFields> {
  const today = new Date().toISOString().split("T")[0];
  const year = new Date().getFullYear();

  const transcript = messages
    .map((message) => `${message.role === "user" ? "Traveler" : "Lockey"}: ${message.content}`)
    .join("\n");

  const prompt = `Extract the trip details already known in this conversation.

Today is ${today}. Default missing years to ${year}. If a month/day date would clearly be in the past this year, use ${year + 1}.

Rules:
- Return JSON only.
- Use exactly these keys: city, country, originCity, departure, return, passportExpiry, purpose.
- Every value must be either a string or null.
- Normalize all dates to YYYY-MM-DD.
- If the traveler gives month and year only, use the first of that month.
- If the traveler gives only a year, use January 1 of that year.
- If the traveler gives departure and return without years, infer both years together consistently.
- "city" is the DESTINATION — where the traveler is flying TO (e.g. "Milan", "Orlando", "Tokyo").
- "country" is the destination country as ISO alpha-2 (e.g. Milan -> IT, Orlando -> US).
- "originCity" is the ORIGIN — where the traveler is departing FROM (e.g. "Chicago", "New York").
- If the traveler says "from X to Y", then originCity = X and city = Y.
- Use the latest explicit traveler-provided correction if a field changes.
- Preserve already confirmed values unless the traveler clearly corrected them.

Already confirmed:
${JSON.stringify(incomingKnown)}

Conversation:
${transcript}`;

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const raw = result.response.text().trim();
  const parsed = JSON.parse(raw) as Partial<Record<FieldKey, string | null>>;

  return sanitizeKnownFields({
    ...incomingKnown,
    ...Object.fromEntries(
      REQUIRED_FIELDS.map((key) => [key, parsed[key] ?? null])
    ),
  });
}

export async function POST(req: NextRequest) {
  let body: { messages: ConversationMessage[]; frameIndex: number; knownFields?: KnownFields };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({
      mascotMessage: "Something went wrong. Please try again.",
      tone: "neutral",
      extractedData: null,
      isComplete: false,
      knownFields: {},
    });
  }

  const { messages, frameIndex, knownFields: incomingKnown = {} } = body;

  if (!messages?.length) {
    return NextResponse.json({
      mascotMessage: "I did not quite catch that. Could you try again?",
      tone: "neutral" as ToneKey,
      extractedData: null,
      isComplete: false,
      knownFields: sanitizeKnownFields(incomingKnown),
    });
  }

  if (frameIndex === 1) {
    try {
      const updatedKnown = await extractFrameZeroKnownFields(messages, sanitizeKnownFields(incomingKnown));
      const reply = buildFrameZeroReply(updatedKnown);
      const tone: ToneKey =
        !reply.isComplete && !updatedKnown.passportExpiry
          ? "neutral"
          : getPassportHeadsUp(updatedKnown)
            ? "empathetic"
            : "excited";

      return NextResponse.json({
        mascotMessage: reply.mascotMessage,
        tone,
        extractedData: reply.extractedData,
        isComplete: reply.isComplete,
        knownFields: updatedKnown,
      });
    } catch (error) {
      console.error("[conversation] frame-zero extraction error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
      return NextResponse.json({
        mascotMessage: "I missed that. Could you tell me your destination and travel dates again?",
        tone: "neutral" as ToneKey,
        extractedData: null,
        isComplete: false,
        knownFields: sanitizeKnownFields(incomingKnown),
      });
    }
  }

  const systemPrompt = buildFrameSystem(frameIndex);
  const historyLines = messages
    .slice(0, -1)
    .map((m) => `${m.role === "user" ? "Traveler" : "Lockey"}: ${m.content}`)
    .join("\n");
  const lastUserMessage = messages[messages.length - 1].content;

  const fullPrompt = historyLines.length > 0
    ? `${systemPrompt}\n\n--- Conversation so far ---\n${historyLines}\nTraveler: ${lastUserMessage}\n\nRespond as Lockey without adding "Lockey:" at the start.`
    : `${systemPrompt}\n\nTraveler: ${lastUserMessage}\n\nRespond as Lockey without adding "Lockey:" at the start.`;

  try {
    const result = await geminiModel.generateContent(fullPrompt);
    const cleanText = result.response.text().trim().replace(/^Lockey:\s*/i, "").trim();

    let tone: ToneKey = "excited";
    if (/delay|cancel|miss|issue|problem|sorry|unfortunate|concern/i.test(cleanText)) {
      tone = "urgent";
    } else if (/expire|renew|passport|warn|caution/i.test(cleanText)) {
      tone = "empathetic";
    }

    return NextResponse.json({
      mascotMessage: cleanText || "Got it! Anything else to adjust?",
      tone,
      extractedData: null,
      isComplete: false,
      knownFields: sanitizeKnownFields(incomingKnown),
    });
  } catch (error) {
    console.error("[conversation] error:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return NextResponse.json({
      mascotMessage: "I missed that. Could you say it again?",
      tone: "neutral" as ToneKey,
      extractedData: null,
      isComplete: false,
      knownFields: sanitizeKnownFields(incomingKnown),
    });
  }
}
