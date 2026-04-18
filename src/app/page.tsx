"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/mascot/Mascot";
import { Button } from "@/components/ui/Button";
import { useMascot } from "@/hooks/useMascot";
import styles from "./page.module.css";

function MicIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <rect height="13" rx="3" stroke="currentColor" strokeWidth="2" width="6" x="9" y="2" />
      <path d="M12 19v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MessageCircleMoreIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
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
  const router = useRouter();
  const { say, stopSpeaking } = useMascot();
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

  function handleStartTrip() {
    stopSpeaking();
    router.push("/trip/new");
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Mascot />

        <div className={styles.controls}>
          <div className={styles.modeRow}>
            <button
              aria-label="Use speech mode"
              className={[styles.micButton, mode === "talk" ? styles.micButtonActive : ""].join(" ")}
              onClick={handleTalk}
              type="button"
            >
              <MicIcon />
            </button>

            <button
              aria-label="Use text mode"
              className={[styles.textModeButton, mode === "text" ? styles.textModeButtonActive : ""].join(" ")}
              onClick={handleText}
              type="button"
            >
              <MessageCircleMoreIcon />
            </button>
          </div>

          <Button onClick={handleStartTrip}>Start Trip</Button>
        </div>
      </section>
    </main>
  );
}
