"use client";

import Image from "next/image";
import { useMascot } from "@/hooks/useMascot";
import type { ToneKey } from "@/lib/elevenlabs/tones";
import { SpeechBubble } from "./SpeechBubble";

const MASCOT_IMAGES: Record<ToneKey, { src: string; alt: string }> = {
  neutral: {
    src: "/mascot/greeting.png",
    alt: "Lockey mascot greeting the traveler",
  },
  excited: {
    src: "/mascot/happy.png",
    alt: "Lockey mascot looking happy",
  },
  empathetic: {
    src: "/mascot/confused.png",
    alt: "Lockey mascot looking concerned",
  },
  urgent: {
    src: "/mascot/confused.png",
    alt: "Lockey mascot in an alert state",
  },
};

interface MascotProps {
  bubblePosition?: "above" | "below";
  bubbleVariant?: "card" | "plain";
  bubbleSize?: "sm" | "lg";
  className?: string;
  figureClassName?: string;
  bubbleClassName?: string;
  bubbleAfterTextSlot?: React.ReactNode;
}

export function Mascot({
  bubblePosition = "above",
  bubbleVariant = "card",
  bubbleSize = "sm",
  className = "",
  figureClassName = "",
  bubbleClassName = "",
  bubbleAfterTextSlot,
}: MascotProps) {
  const { speech, visibleLength, tone, isSpeaking, isThinking } = useMascot();
  const mascotImage = isThinking
    ? { src: "/mascot/thinking.png", alt: "Lockey mascot thinking" }
    : MASCOT_IMAGES[tone];
  const imageNode = (
    <div
      className={figureClassName}
      data-speaking={String(isSpeaking)}
      data-thinking={String(isThinking)}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        isolation: "isolate",
        transform: isSpeaking && !isThinking ? "translateY(-2px)" : undefined,
        transition: isThinking ? undefined : "transform 150ms ease",
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
          position: "relative",
          zIndex: 1,
        }}
        width={280}
      />
    </div>
  );

  const bubbleNode = speech || isThinking ? (
    <SpeechBubble
      afterTextSlot={bubbleAfterTextSlot}
      className={bubbleClassName}
      isThinking={isThinking}
      key={isThinking ? "__thinking__" : speech}
      size={bubbleSize}
      text={speech ?? ""}
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
