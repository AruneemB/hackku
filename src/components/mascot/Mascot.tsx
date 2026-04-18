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

interface MascotProps {
  bubblePosition?: "above" | "below";
  bubbleVariant?: "card" | "plain";
  bubbleSize?: "sm" | "lg";
  className?: string;
  figureClassName?: string;
  bubbleClassName?: string;
}

export function Mascot({
  bubblePosition = "above",
  bubbleVariant = "card",
  bubbleSize = "sm",
  className = "",
  figureClassName = "",
  bubbleClassName = "",
}: MascotProps) {
  const { speech, visibleLength, tone, isSpeaking } = useMascot();
  const mascotImage = MASCOT_IMAGES[tone];
  const imageNode = (
    <div
      className={figureClassName}
      data-speaking={String(isSpeaking)}
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
  );

  const bubbleNode = speech ? (
    <SpeechBubble
      className={bubbleClassName}
      key={speech}
      size={bubbleSize}
      text={speech}
      visibleLength={visibleLength}
      variant={bubbleVariant}
    />
  ) : null;

  return (
    <div
      className={className}
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 16,
      }}
    >
      {bubblePosition === "above" ? bubbleNode : null}
      {imageNode}
      {bubblePosition === "below" ? bubbleNode : null}
    </div>
  );
}
