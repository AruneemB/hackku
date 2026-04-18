"use client";

import { useEffect, useState } from "react";

interface SpeechBubbleProps {
  text: string;
}

export function SpeechBubble({ text }: SpeechBubbleProps) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let currentIndex = 0;

    const intervalId = window.setInterval(() => {
      currentIndex += 1;
      setDisplayed(text.slice(0, currentIndex));

      if (currentIndex >= text.length) {
        window.clearInterval(intervalId);
      }
    }, 24);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [text]);

  return (
    <div
      style={{
        maxWidth: 260,
        padding: "14px 16px",
        border: "1px solid #e8eaec",
        borderRadius: 18,
        background: "#ffffff",
        boxShadow: "0 16px 30px rgba(45, 59, 69, 0.08)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "var(--cc-text-primary)",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {displayed}
      </p>
    </div>
  );
}
