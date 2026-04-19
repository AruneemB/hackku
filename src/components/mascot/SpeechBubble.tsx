"use client";

interface SpeechBubbleProps {
  text: string;
  visibleLength?: number;
  variant?: "card" | "plain";
  size?: "sm" | "lg";
  className?: string;
  isThinking?: boolean;
  afterTextSlot?: React.ReactNode;
}

export function SpeechBubble({
  text,
  visibleLength,
  variant = "card",
  size = "sm",
  className = "",
  isThinking = false,
  afterTextSlot,
}: SpeechBubbleProps) {
  const displayed = text.slice(0, visibleLength ?? text.length);
  const length = displayed.length;

  let fontSize = size === "lg" ? 22 : 13;
  let lineHeight = size === "lg" ? 1.24 : 1.45;

  if (size === "lg") {
    if (length > 220) {
      fontSize = 15;
      lineHeight = 1.18;
    } else if (length > 170) {
      fontSize = 17;
      lineHeight = 1.2;
    } else if (length > 125) {
      fontSize = 19;
      lineHeight = 1.22;
    }
  } else {
    if (length > 150) {
      fontSize = 10.5;
      lineHeight = 1.32;
    } else if (length > 110) {
      fontSize = 11.5;
      lineHeight = 1.36;
    } else if (length > 80) {
      fontSize = 12;
      lineHeight = 1.4;
    }
  }

  const textStyle =
    size === "lg"
      ? {
          fontSize,
          lineHeight,
          letterSpacing: "-0.03em",
          fontWeight: 600,
          transition: "font-size 240ms ease, line-height 240ms ease",
        }
      : {
          fontSize,
          lineHeight,
          letterSpacing: "0",
          fontWeight: 500,
          transition: "font-size 240ms ease, line-height 240ms ease",
        };

  const bubbleHeight = size === "lg" ? 108 : 86;

  const wrapperStyle =
    variant === "plain"
      ? {
          maxWidth: 320,
          height: bubbleHeight,
          padding: 0,
          border: "none",
          borderRadius: 0,
          background: "transparent",
          boxShadow: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }
      : {
          maxWidth: 260,
          height: bubbleHeight,
          padding: "14px 16px",
          border: "1px solid #e8eaec",
          borderRadius: 18,
          background: "#ffffff",
          boxShadow: "0 16px 30px rgba(45, 59, 69, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };

  return (
    <div className={className} style={wrapperStyle}>
      {isThinking ? (
        <div className="thinking-dots">
          <span />
          <span />
          <span />
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            color: "var(--cc-text-primary)",
            textAlign: "center",
            ...textStyle,
          }}
        >
          {displayed}
          {afterTextSlot ? (
            <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle", marginLeft: 2 }}>
              {afterTextSlot}
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}
