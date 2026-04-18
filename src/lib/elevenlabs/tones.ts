// ============================================================
// LIB: ElevenLabs Voice Tones
// OWNER: Track B (AI & Intelligence)
// DESCRIPTION: Maps tone names to ElevenLabs voice_settings.
//   stability: 0=more variable/emotional, 1=consistent/flat
//   similarity_boost: 0=looser, 1=closer to base voice
//   style: expressiveness (0-1, model-dependent)
//
//   Used by lib/elevenlabs/client.ts → speak()
//   Triggered by: useMascot hook's tone state
// ============================================================

export const TONES = {
  // Frame 1, 2, 3: standard assistant tone
  neutral: {
    stability: 0.75,
    similarity_boost: 0.75,
    style: 0.0,
  },

  // Frame 7 (approved), Frame 8: booking confirmed
  excited: {
    stability: 0.35,
    similarity_boost: 0.80,
    style: 0.6,
  },

  // Frame 7 (rejected), Frame 10: flight delay
  empathetic: {
    stability: 0.65,
    similarity_boost: 0.70,
    style: 0.3,
  },

  // Frame 14: escalation / emergency
  urgent: {
    stability: 0.50,
    similarity_boost: 0.85,
    style: 0.5,
  },
} as const;

export type ToneKey = keyof typeof TONES;
