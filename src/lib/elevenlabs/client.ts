// ============================================================
// LIB: ElevenLabs TTS Client
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Converts mascot speech text to audio. Returns
//   an audio stream/blob that the Mascot component plays via
//   the Web Audio API or an <audio> element.
//
//   Tones are achieved by adjusting stability + similarity_boost
//   settings — see lib/elevenlabs/tones.ts for values.
//
// ENV REQUIRED:
//   ELEVENLABS_API_KEY
//   ELEVENLABS_VOICE_ID  (e.g. Rachel — warm, professional)
//
// USAGE:
//   import { speak } from "@/lib/elevenlabs/client"
//   const audioBlob = await speak("Kelli, your flight is delayed.", "empathetic")
// ============================================================

// TODO: import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"
// TODO: import { TONES } from "./tones"

// TODO: const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

// TODO: export async function speak(text: string, tone: keyof typeof TONES): Promise<ReadableStream> {
//   // const toneSettings = TONES[tone]
//   // const audio = await client.textToSpeech.stream(
//   //   process.env.ELEVENLABS_VOICE_ID!,
//   //   { text, voice_settings: toneSettings, model_id: "eleven_multilingual_v2" }
//   // )
//   // return audio  ← stream to browser or convert to blob
// }
