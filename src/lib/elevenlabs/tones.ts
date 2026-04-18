// stability:        0=emotional/variable pitch (human), 1=flat/consistent (robotic)
// similarity_boost: how closely to adhere to the base voice character
// style:            0=neutral delivery, 1=maximum expressiveness/emotion
// use_speaker_boost: cleans audio artifacts

export const TONES = {
  neutral: {
    stability: 0.46,
    similarity_boost: 0.78,
    style: 0.24,
    use_speaker_boost: true,
  },
  excited: {
    stability: 0.34,
    similarity_boost: 0.72,
    style: 0.34,
    use_speaker_boost: true,
  },
  empathetic: {
    stability: 0.56,
    similarity_boost: 0.78,
    style: 0.18,
    use_speaker_boost: true,
  },
  urgent: {
    stability: 0.38,
    similarity_boost: 0.76,
    style: 0.28,
    use_speaker_boost: true,
  },
} as const;

export type ToneKey = keyof typeof TONES;
