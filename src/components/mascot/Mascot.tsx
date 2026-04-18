"use client";

import Image from "next/image";
import { useMascot } from "@/hooks/useMascot";
import type { ToneKey } from "@/lib/elevenlabs/tones";
import { SpeechBubble } from "./SpeechBubble";

const MASCOT_IMAGES: Record<ToneKey, { src: string; alt: string }> = {
  neutral: {
    src: "/mascot/greeting.png",
    alt: "Kelli mascot greeting the traveler",
  },
  excited: {
    src: "/mascot/happy.png",
    alt: "Kelli mascot looking happy",
  },
  empathetic: {
    src: "/mascot/confused.png",
    alt: "Kelli mascot looking concerned",
  },
  urgent: {
    src: "/mascot/confused.png",
    alt: "Kelli mascot in an alert state",
  },
};

export function Mascot() {
  const { speech, tone, isSpeaking } = useMascot();
  const mascotImage = MASCOT_IMAGES[tone];

  return (
    <div
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 16,
      }}
    >
      {speech ? <SpeechBubble key={speech} text={speech} /> : null}

      <div
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          transform: isSpeaking ? "translateY(-2px)" : "translateY(0)",
          transition: "transform 150ms ease",
        }}
      >
        <Image
          alt={mascotImage.alt}
          height={280}
          priority
          src={mascotImage.src}
          style={{
            width: "min(280px, 60vw)",
            height: "auto",
          }}
          width={280}
        />
      </div>
    </div>
  );
}
