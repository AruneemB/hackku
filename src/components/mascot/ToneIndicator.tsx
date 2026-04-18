"use client";

import type { ToneKey } from "@/lib/elevenlabs/tones";

const TONE_STYLES: Record<ToneKey, { background: string; label: string }> = {
  neutral: { background: "#9fabb7", label: "Neutral" },
  excited: { background: "#00c389", label: "Excited" },
  empathetic: { background: "#d9bb74", label: "Empathetic" },
  urgent: { background: "#fc5050", label: "Urgent" },
};

export function ToneIndicator({ tone }: { tone: ToneKey }) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <span
      aria-label={`Mascot tone: ${toneStyle.label}`}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 70,
        minHeight: 24,
        padding: "0 10px",
        borderRadius: 999,
        background: toneStyle.background,
        color: "#ffffff",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {toneStyle.label}
    </span>
  );
}
