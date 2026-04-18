"use client";

import { useEffect, useState } from "react";

interface SpeechBubbleProps {
  text: string;
  variant?: "card" | "plain";
  size?: "sm" | "lg";
  className?: string;
}

export function SpeechBubble({
  text,
  variant = "card",
  size = "sm",
  className = "",
}: SpeechBubbleProps) {
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

  const textStyle =
    size === "lg"
      ? {
          fontSize: 22,
          lineHeight: 1.24,
          letterSpacing: "-0.03em",
          fontWeight: 600,
        }
      : {
          fontSize: 13,
          lineHeight: 1.45,
          letterSpacing: "0",
          fontWeight: 500,
        };

  const wrapperStyle =
    variant === "plain"
      ? {
          maxWidth: 320,
          padding: 0,
          border: "none",
          borderRadius: 0,
          background: "transparent",
          boxShadow: "none",
        }
      : {
          maxWidth: 260,
          padding: "14px 16px",
          border: "1px solid #e8eaec",
          borderRadius: 18,
          background: "#ffffff",
          boxShadow: "0 16px 30px rgba(45, 59, 69, 0.08)",
        };

  return (
    <div className={className} style={wrapperStyle}>
      <p
        style={{
          margin: 0,
          color: "var(--cc-text-primary)",
          ...textStyle,
        }}
      >
        {displayed}
      </p>
    </div>
  );
}
