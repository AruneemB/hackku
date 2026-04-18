"use client";

import { useEffect, useState } from "react";
import type { ToneKey } from "@/lib/elevenlabs/tones";

type MascotState = {
  speech: string;
  tone: ToneKey;
  isSpeaking: boolean;
};

const listeners = new Set<() => void>();

let mascotState: MascotState = {
  speech: "",
  tone: "neutral",
  isSpeaking: false,
};

let fallbackTimer: number | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setMascotState(nextState: Partial<MascotState>) {
  mascotState = { ...mascotState, ...nextState };
  emitChange();
}

function clearSpeechWork() {
  if (fallbackTimer) {
    window.clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function getFallbackDuration(text: string) {
  return Math.min(Math.max(text.length * 35, 1500), 5000);
}

async function say(text: string, newTone?: ToneKey) {
  if (typeof window === "undefined") {
    return;
  }

  clearSpeechWork();

  const tone = newTone ?? mascotState.tone;
  setMascotState({
    speech: text,
    tone,
    isSpeaking: true,
  });

  if (!("speechSynthesis" in window)) {
    await new Promise<void>((resolve) => {
      fallbackTimer = window.setTimeout(() => {
        setMascotState({ isSpeaking: false });
        fallbackTimer = null;
        resolve();
      }, getFallbackDuration(text));
    });

    return;
  }

  await new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = tone === "urgent" ? 1.08 : tone === "excited" ? 1.02 : 0.98;
    utterance.pitch = tone === "excited" ? 1.1 : tone === "empathetic" ? 0.95 : 1;
    utterance.onend = () => {
      setMascotState({ isSpeaking: false });
      resolve();
    };
    utterance.onerror = () => {
      setMascotState({ isSpeaking: false });
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

function setTone(tone: ToneKey) {
  setMascotState({ tone });
}

function stopSpeaking() {
  if (typeof window === "undefined") {
    return;
  }

  clearSpeechWork();
  setMascotState({ isSpeaking: false });
}

export function useMascot() {
  const [state, setState] = useState(mascotState);

  useEffect(() => {
    function handleChange() {
      setState({ ...mascotState });
    }

    listeners.add(handleChange);
    handleChange();

    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    ...state,
    say,
    setTone,
    stopSpeaking,
  };
}
