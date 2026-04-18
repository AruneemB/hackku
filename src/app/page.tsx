"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/mascot/Mascot";
import { useMascot } from "@/hooks/useMascot";
import styles from "./page.module.css";

function MenuIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 24 24" width="30">
      <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 12h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 24 24" width="30">
      <path d="M8 6h13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M8 12h13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M8 18h13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path
        d="M4 6h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <path
        d="M4 12h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
      <path
        d="M4 18h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="40" viewBox="0 0 24 24" width="40">
      <rect height="13" rx="3" stroke="currentColor" strokeWidth="2" width="6" x="9" y="2" />
      <path d="M12 19v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MessageCircleMoreIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 24 24" width="30">
      <path
        d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M8 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M12 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M16 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
}

export default function HomePage() {
  const { say } = useMascot();
  const [mode, setMode] = useState<"talk" | "text">("talk");

  useEffect(() => {
    void say("Hi Kelli! Where are we headed today?", "neutral");
  }, [say]);

  function handleTalk() {
    setMode("talk");
    void say("Talk mode is ready.", "excited");
  }

  function handleText() {
    setMode("text");
    void say("Text mode is ready.", "neutral");
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <button aria-label="Open menu" className={styles.menuButton} type="button">
          <MenuIcon />
        </button>

        <div className={styles.stage}>
          <Mascot
            bubbleClassName={styles.speech}
            bubblePosition="below"
            bubbleSize="lg"
            bubbleVariant="plain"
            className={styles.mascot}
            figureClassName={styles.figure}
          />
        </div>

        <div className={styles.controls}>
          <button
            aria-label="Trip planning unavailable"
            className={[styles.iconButton, styles.sideButton, styles.leftButton, styles.disabledButton].join(" ")}
            disabled
            type="button"
          >
            <ListIcon />
          </button>

          <button
            aria-label="Use speech mode"
            className={[styles.iconButton, styles.primaryButton, mode === "talk" ? styles.buttonActive : ""].join(" ")}
            onClick={handleTalk}
            type="button"
          >
            <MicIcon />
          </button>

          <button
            aria-label="Use text mode"
            className={[styles.iconButton, styles.sideButton, styles.rightButton, mode === "text" ? styles.buttonActive : ""].join(" ")}
            onClick={handleText}
            type="button"
          >
            <MessageCircleMoreIcon />
          </button>
        </div>
      </section>
    </main>
  );
}
