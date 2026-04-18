import { TONES, type ToneKey } from "./tones";

type ElevenLabsVoice = {
  voice_id: string;
  category: string;
  name: string;
};

export type ElevenLabsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export type ElevenLabsSpeech = {
  audio: ArrayBuffer;
  alignment: ElevenLabsAlignment | null;
  normalizedAlignment: ElevenLabsAlignment | null;
};

type ElevenLabsTimingResponse = {
  audio_base64: string;
  alignment?: ElevenLabsAlignment | null;
  normalized_alignment?: ElevenLabsAlignment | null;
};

let cachedVoiceId: string | null = null;

const DEFAULT_MODEL_ID = "eleven_flash_v2_5";

const DISCOVERABLE_VOICE_CATEGORIES = new Set([
  "premade",
  "generated",
  "cloned",
  "professional",
]);

// Speed per tone - passed at request body level (not inside voice_settings)
const TONE_SPEED: Record<ToneKey, number> = {
  neutral: 1.02,
  excited: 1.06,
  empathetic: 0.96,
  urgent: 1.04,
};

// Ordered toward brighter male voices so the mascot stays upbeat without sounding deep.
const DEFAULT_PREFERRED_VOICE_NAMES = [
  "Liam",
  "Will",
  "Chris",
  "Roger",
  "Charlie",
  "Eric",
];

function normalizeVoiceName(name: string): string {
  return name.trim().toLowerCase();
}

function getShortVoiceName(name: string): string {
  return name.split(" - ")[0]?.trim() ?? name.trim();
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function normalizeAlignment(
  alignment: ElevenLabsAlignment | null | undefined,
  fallbackText: string
): ElevenLabsAlignment | null {
  if (!alignment) return null;

  if (
    alignment.characters.length !== alignment.character_start_times_seconds.length ||
    alignment.characters.length !== alignment.character_end_times_seconds.length
  ) {
    return null;
  }

  if (alignment.characters.length === 0 || alignment.characters.join("") !== fallbackText) {
    return null;
  }

  return alignment;
}

export function getPreferredVoiceNames(): string[] {
  const fromEnv = process.env.ELEVENLABS_PREFERRED_VOICE_NAMES
    ?.split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return fromEnv && fromEnv.length > 0
    ? fromEnv
    : DEFAULT_PREFERRED_VOICE_NAMES;
}

export function pickPreferredVoice(
  voices: ElevenLabsVoice[],
  preferredNames = getPreferredVoiceNames()
): ElevenLabsVoice | null {
  const discoverable = voices.filter((voice) =>
    DISCOVERABLE_VOICE_CATEGORIES.has(voice.category)
  );
  const pool = discoverable.length > 0 ? discoverable : voices;

  for (const preferredName of preferredNames) {
    const normalizedPreferred = normalizeVoiceName(preferredName);
    const picked = pool.find((voice) => {
      const normalizedVoice = normalizeVoiceName(voice.name);
      const normalizedShort = normalizeVoiceName(getShortVoiceName(voice.name));

      return (
        normalizedVoice === normalizedPreferred ||
        normalizedShort === normalizedPreferred ||
        normalizedVoice.startsWith(`${normalizedPreferred} -`)
      );
    });

    if (picked) return picked;
  }

  return pool[0] ?? null;
}

function getModelId(): string {
  return process.env.ELEVENLABS_MODEL_ID?.trim() || DEFAULT_MODEL_ID;
}

async function fetchVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    throw new Error(`Failed to list voices: ${res.status}`);
  }

  const json = (await res.json()) as {
    voices: ElevenLabsVoice[];
  };

  return json.voices ?? [];
}

async function resolveVoiceId(apiKey: string, ignoreConfigured = false): Promise<string | null> {
  const configured = process.env.ELEVENLABS_VOICE_ID?.trim() || null;

  if (!ignoreConfigured && configured) {
    cachedVoiceId = configured;
    return configured;
  }

  if (cachedVoiceId) return cachedVoiceId;

  try {
    const voices = await fetchVoices(apiKey);
    const picked = pickPreferredVoice(voices);

    if (picked) {
      cachedVoiceId = picked.voice_id;
      console.log(`[elevenlabs] using voice: ${picked.name} (${picked.voice_id})`);
      return picked.voice_id;
    }
  } catch {
    // Network error - fall back to configured env var if present.
  }

  return configured || null;
}

async function requestSpeech(
  apiKey: string,
  voiceId: string,
  text: string,
  tone: ToneKey
) {
  const voiceSettings = TONES[tone] ?? TONES.neutral;
  const speed = TONE_SPEED[tone] ?? 1.0;

  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: getModelId(),
      voice_settings: voiceSettings,
      speed,
    }),
  });
}

async function parseSpeechResponse(
  res: Response,
  text: string
): Promise<ElevenLabsSpeech | null> {
  const json = (await res.json()) as ElevenLabsTimingResponse;
  if (!json.audio_base64) return null;

  return {
    audio: base64ToArrayBuffer(json.audio_base64),
    alignment:
      normalizeAlignment(json.alignment, text) ??
      normalizeAlignment(json.normalized_alignment, text),
    normalizedAlignment: normalizeAlignment(json.normalized_alignment, text),
  };
}

export type SpeakResult =
  | { ok: true; speech: ElevenLabsSpeech; voiceId: string }
  | { ok: false; reason: string; status?: number; voiceId?: string };

export async function speak(text: string, tone: ToneKey): Promise<SpeakResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "ELEVENLABS_API_KEY not set" };
  }

  const configuredVoiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || null;
  const voiceId = await resolveVoiceId(apiKey);
  if (!voiceId) {
    return { ok: false, reason: "No ElevenLabs voice available" };
  }

  console.log(`[elevenlabs] speak using voice=${voiceId} (configured=${configuredVoiceId ?? "none"}) tone=${tone}`);

  const res = await requestSpeech(apiKey, voiceId, text, tone);

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[elevenlabs] request failed status=${res.status} voice=${voiceId}: ${errText}`);
    if (res.status === 402) cachedVoiceId = null;
    return { ok: false, reason: errText || `status ${res.status}`, status: res.status, voiceId };
  }

  const speech = await parseSpeechResponse(res, text);
  if (!speech) {
    return { ok: false, reason: "Empty response from ElevenLabs", voiceId };
  }

  return { ok: true, speech, voiceId };
}
