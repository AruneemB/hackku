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

// TODO: import { useState, useCallback } from "react"
// TODO: import { speak } from "@/lib/elevenlabs/client"
// TODO: import type { ToneKey } from "@/lib/elevenlabs/tones"

// TODO: export function useMascot() {
//   // const [speech, setSpeech] = useState<string>("")
//   // const [tone, setTone] = useState<ToneKey>("neutral")
//   // const [isSpeaking, setIsSpeaking] = useState(false)
//
//   // const say = useCallback(async (text: string, newTone?: ToneKey) => {
//   //   if (newTone) setTone(newTone)
//   //   setSpeech(text)
//   //   setIsSpeaking(true)
//   //   const audio = await speak(text, newTone ?? tone)
//   //   // play audio stream
//   //   setIsSpeaking(false)
//   // }, [tone])
//
//   // return { speech, tone, isSpeaking, say, setTone }
// }
