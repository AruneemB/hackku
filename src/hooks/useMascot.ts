// ============================================================
// HOOK: useMascot
// OWNER: Track A (Frontend & UX) + Track B (ElevenLabs)
// DESCRIPTION: Central state manager for the mascot character.
//   Controls what the mascot says, what tone it speaks in,
//   and whether it is currently speaking (for animation).
//
//   Tone is set by business logic (e.g. approved → "excited",
//   delayed → "empathetic") and consumed by:
//   - SpeechBubble.tsx (displays text)
//   - ToneIndicator.tsx (changes mascot color/expression)
//   - ElevenLabs client (controls voice stability settings)
//
// USAGE:
//   const { speech, tone, isSpeaking, say, setTone } = useMascot()
//   say("Kelli, your trip is approved!", "excited")
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
// Mock speak function for now as ElevenLabs client is also likely a scaffold
// import { speak } from "@/lib/elevenlabs/client";
import type { ToneKey } from "@/lib/elevenlabs/tones";

export function useMascot() {
  const [speech, setSpeech] = useState<string>("");
  const [tone, setTone] = useState<ToneKey>("neutral");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const say = useCallback(async (text: string, newTone?: ToneKey) => {
    if (newTone) setTone(newTone);
    setSpeech(text);
    setIsSpeaking(true);
    console.log(`Mascot says: "${text}" with tone: ${newTone || tone}`);
    // const audio = await speak(text, newTone ?? tone)
    // play audio stream
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, 2000); // Simulate speaking
  }, [tone]);

  return { speech, tone, isSpeaking, say, setTone };
}
