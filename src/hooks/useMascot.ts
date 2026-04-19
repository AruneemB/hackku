"use client";

import { useEffect, useState } from "react";
import type { ToneKey } from "@/lib/elevenlabs/tones";

type SpeechAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type MascotState = {
  speech: string;
  visibleLength: number;
  tone: ToneKey;
  isSpeaking: boolean;
  isThinking: boolean;
};

const listeners = new Set<() => void>();

let mascotState: MascotState = {
  speech: "",
  visibleLength: 0,
  tone: "neutral",
  isSpeaking: false,
  isThinking: false,
};

let fallbackTimer: number | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let syncFrame: number | null = null;
let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Play a silent buffer to satisfy browser autoplay policy.
  try {
    const ctx = new AudioContext();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    ctx.close();
  } catch { /* ignore */ }
}

if (typeof window !== "undefined") {
  const unlock = () => { unlockAudio(); window.removeEventListener("click", unlock, true); window.removeEventListener("touchend", unlock, true); };
  window.addEventListener("click", unlock, true);
  window.addEventListener("touchend", unlock, true);
}

function emitChange() {
  listeners.forEach((l) => l());
}

function setMascotState(next: Partial<MascotState>) {
  mascotState = { ...mascotState, ...next };
  emitChange();
}

function clearSpeechWork() {
  if (fallbackTimer) {
    window.clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  if (syncFrame) {
    window.cancelAnimationFrame(syncFrame);
    syncFrame = null;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function getFallbackDuration(text: string) {
  return Math.min(Math.max(text.length * 35, 1500), 5000);
}

function base64ToBlob(base64: string, type: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

function revealTo(length: number) {
  const clamped = Math.max(0, Math.min(length, mascotState.speech.length));
  if (mascotState.visibleLength === clamped) return;
  setMascotState({ visibleLength: clamped });
}

function startEstimatedReveal(text: string, durationMs: number) {
  const startedAt = performance.now();

  const tick = () => {
    const elapsed = performance.now() - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    revealTo(Math.round(text.length * progress));

    if (progress < 1) {
      syncFrame = window.requestAnimationFrame(tick);
    } else {
      syncFrame = null;
    }
  };

  revealTo(0);
  syncFrame = window.requestAnimationFrame(tick);
}

function startTimedReveal(audio: HTMLAudioElement, alignment: SpeechAlignment, text: string) {
  const starts = alignment.character_start_times_seconds;
  if (starts.length === 0 || starts.length !== text.length) {
    revealTo(text.length);
    return;
  }

  const tick = () => {
    const currentTime = audio.currentTime;
    let nextLength = text.length;

    for (let i = 0; i < starts.length; i += 1) {
      if (starts[i] > currentTime) {
        nextLength = i;
        break;
      }
    }

    revealTo(nextLength);

    if (!audio.paused && !audio.ended) {
      syncFrame = window.requestAnimationFrame(tick);
    } else {
      syncFrame = null;
      if (audio.ended) revealTo(text.length);
    }
  };

  revealTo(0);
  syncFrame = window.requestAnimationFrame(tick);
}

async function speakWithElevenLabs(text: string, tone: ToneKey): Promise<boolean> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tone }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn("[mascot] ElevenLabs unavailable — falling back to browser TTS:", body);
      return false;
    }

    const data = (await res.json()) as {
      audioBase64?: string;
      alignment?: SpeechAlignment | null;
      voiceId?: string;
    };

    if (!data.audioBase64) {
      console.warn("[mascot] ElevenLabs returned no audio — falling back to browser TTS");
      return false;
    }
    console.log(`[mascot] playing ElevenLabs voice ${data.voiceId}`);

    const blob = base64ToBlob(data.audioBase64, "audio/mpeg");
    const url = URL.createObjectURL(blob);
    currentAudioUrl = url;

    const audio = new Audio(url);
    currentAudio = audio;

    await new Promise<void>((resolve) => {
      const cleanup = () => {
        if (currentAudioUrl === url) {
          URL.revokeObjectURL(url);
          currentAudioUrl = null;
        }
        currentAudio = null;
        if (syncFrame) {
          window.cancelAnimationFrame(syncFrame);
          syncFrame = null;
        }
        revealTo(text.length);
        setMascotState({ isSpeaking: false });
        resolve();
      };

      audio.onended = cleanup;
      audio.onerror = cleanup;
      audio.onplay = () => {
        if (data.alignment) {
          startTimedReveal(audio, data.alignment, text);
        } else {
          startEstimatedReveal(text, getFallbackDuration(text));
        }
      };

      audio.play().catch((err) => {
        console.warn("[mascot] audio.play() rejected — falling back to browser TTS:", err);
        // Autoplay blocked — release the audio resources but keep isSpeaking:true
        // so the speech bubble stays visible while browser TTS runs.
        if (currentAudioUrl === url) {
          URL.revokeObjectURL(url);
          currentAudioUrl = null;
        }
        currentAudio = null;
        if (syncFrame) { window.cancelAnimationFrame(syncFrame); syncFrame = null; }

        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = tone === "urgent" ? 1.08 : tone === "excited" ? 1.02 : 0.98;
          utterance.pitch = tone === "excited" ? 1.1 : tone === "empathetic" ? 0.95 : 1;
          revealTo(0);
          utterance.onboundary = (event) => revealTo(event.charIndex);
          utterance.onend = () => { revealTo(text.length); setMascotState({ isSpeaking: false }); resolve(); };
          utterance.onerror = () => {
            const ms = getFallbackDuration(text);
            startEstimatedReveal(text, ms);
            fallbackTimer = (window as any).setTimeout(() => { fallbackTimer = null; setMascotState({ isSpeaking: false }); resolve(); }, ms);
          };
          window.speechSynthesis.speak(utterance);
        } else {
          const ms = getFallbackDuration(text);
          startEstimatedReveal(text, ms);
          fallbackTimer = (window as any).setTimeout(() => { fallbackTimer = null; setMascotState({ isSpeaking: false }); resolve(); }, ms);
        }
      });
    });

    return true;
  } catch {
    return false;
  }
}

async function speakWithBrowser(text: string, tone: ToneKey): Promise<void> {
  if (!("speechSynthesis" in window)) {
    const ms = getFallbackDuration(text);
    startEstimatedReveal(text, ms);
    await new Promise<void>((resolve) => {
      fallbackTimer = (window as any).setTimeout(() => {
        revealTo(text.length);
        setMascotState({ isSpeaking: false });
        fallbackTimer = null;
        resolve();
      }, ms);
    });
    return;
  }

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = tone === "urgent" ? 1.08 : tone === "excited" ? 1.02 : 0.98;
    utterance.pitch = tone === "excited" ? 1.1 : tone === "empathetic" ? 0.95 : 1;
    utterance.onstart = () => {
      revealTo(0);
    };
    utterance.onboundary = (event) => {
      revealTo(event.charIndex);
    };
    utterance.onend = () => {
      revealTo(text.length);
      setMascotState({ isSpeaking: false });
      resolve();
    };
    utterance.onerror = () => {
      const ms = getFallbackDuration(text);
      startEstimatedReveal(text, ms);
      fallbackTimer = (window as any).setTimeout(() => {
        revealTo(text.length);
        setMascotState({ isSpeaking: false });
        fallbackTimer = null;
        resolve();
      }, ms);
    };
    window.speechSynthesis.speak(utterance);
  });
}

async function say(text: string, newTone?: ToneKey) {
  if (typeof window === "undefined") return;

  clearSpeechWork();

  const tone = newTone ?? mascotState.tone;
  setMascotState({ speech: text, visibleLength: 0, tone, isSpeaking: true, isThinking: false });

  const ok = await speakWithElevenLabs(text, tone);
  if (!ok) await speakWithBrowser(text, tone);
}

function setTone(tone: ToneKey) {
  setMascotState({ tone });
}

function setThinking(isThinking: boolean) {
  setMascotState({ isThinking });
}

function stopSpeaking() {
  if (typeof window === "undefined") return;
  clearSpeechWork();
  setMascotState({ isSpeaking: false, isThinking: false, visibleLength: mascotState.speech.length });
}

export function useMascot() {
  const [state, setState] = useState(mascotState);

  useEffect(() => {
    function onUpdate() {
      setState({ ...mascotState });
    }
    listeners.add(onUpdate);
    onUpdate();
    return () => {
      listeners.delete(onUpdate);
    };
  }, []);

  return { ...state, say, setTone, setThinking, stopSpeaking };
}
