"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/mascot/Mascot";
import { useMascot } from "@/hooks/useMascot";
import styles from "./page.module.css";

type Tone = "neutral" | "excited" | "empathetic" | "urgent";

type DemoFrame = {
  tone: Tone;
  message: string;
  modalTitle: string;
  modalBody: string;
  options: [string, string];
};

const FRAMES: DemoFrame[] = [
  {
    tone: "neutral",
    message: "Hi Kelli. Tell me where you are going and the dates, and I will start a draft trip.",
    modalTitle: "Milan, Italy. Sep 14 to Sep 19.",
    modalBody: "Your passport expires within six months. Is that the right trip setup to continue with?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "I am searching nearby airports, a five-day window, and Saturday-night savings.",
    modalTitle: "I found nearby-airport and weekend-stay options.",
    modalBody: "Do these flight search results look right, or should I keep refining them?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "I found nearby hotels and highlighted preferred vendors close to the client office.",
    modalTitle: "Preferred hotels near the client office are ready.",
    modalBody: "Is this the right area and hotel mix for the trip?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "empathetic",
    message: "I checked the rules. You need a Type-C visa and this hotel needs a quick sign-off.",
    modalTitle: "One visa requirement and one hotel exception were found.",
    modalBody: "Is this compliance readout right before I package the bundle choices?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "excited",
    message: "Here are three bundle paths. I can optimize for policy, savings, or proximity.",
    modalTitle: "I prepared three trip bundles.",
    modalBody: "Does the direction look right, or should I rethink the recommendation?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "I drafted the approval email and started watching the manager thread.",
    modalTitle: "The approval request is ready to send.",
    modalBody: "Is this rationale right for the manager handoff?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "empathetic",
    message: "The manager rejected the hotel cost. Here is a compliant alternative ready to resubmit.",
    modalTitle: "I built a compliant recovery option.",
    modalBody: "Is this the right alternative to send back for approval?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "excited",
    message: "Your trip is approved. I generated the checklist, visa link, and packing reminders.",
    modalTitle: "Your travel checklist is ready.",
    modalBody: "Does this prep list look right before travel day?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "Live mode is active. Your gate, weather, hotel, and travel conditions are updating.",
    modalTitle: "Live travel updates are active.",
    modalBody: "Is this the right information to surface on travel day?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "urgent",
    message: "I detected a delay. I already found a later flight and notified your hotel.",
    modalTitle: "A recovery option is ready.",
    modalBody: "Is this the right response to the delay?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "urgent",
    message: "The only rebooking is over budget. I drafted an emergency exception for your manager.",
    modalTitle: "An exception request is prepared.",
    modalBody: "Is this the right escalation path for the disruption?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "You have arrived. Here is the fastest route to the hotel and your daily meal allowance.",
    modalTitle: "Arrival support is ready.",
    modalBody: "Is this the right on-the-ground guidance to show after landing?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "Hold the receipt to the camera. I will extract the merchant, total, and date.",
    modalTitle: "Receipt capture is ready.",
    modalBody: "Is this the right moment to collect the expense details?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "urgent",
    message: "This requires a human touch. Here is the travel desk and the nearest embassy.",
    modalTitle: "Human support handoff is ready.",
    modalBody: "Is this the right escalation information to show in a critical moment?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "excited",
    message: "I summarized your final spend and drafted the expense report. This trip is ready to archive.",
    modalTitle: "Trip closeout is ready.",
    modalBody: "Is this the right summary before archiving the trip?",
    options: ["Right", "Wrong"],
  },
  {
    tone: "neutral",
    message: "Here is exactly how your travel data was used, limited, and protected.",
    modalTitle: "Privacy summary is ready.",
    modalBody: "Is this the right transparency screen to end the flow with?",
    options: ["Right", "Wrong"],
  },
];

function PhoneShell({
  overlay,
  overlayOpen,
}: {
  overlay: React.ReactNode;
  overlayOpen: boolean;
}) {
  return (
    <div className={styles.phone}>
      <div className={styles.screen}>
        <div className={[styles.screenInner, overlayOpen ? styles.screenInnerBlurred : ""].join(" ")}>
          <div className={styles.mascotStage}>
            <Mascot />
          </div>
        </div>

        {overlayOpen ? (
          <div className={styles.overlay}>
            <div className={styles.overlayCard}>{overlay}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Overlay({
  frame,
  onSelect,
}: {
  frame: DemoFrame;
  onSelect: (value: string) => void;
}) {
  return (
    <div className={styles.overlayContent}>
      <div className={styles.overlayText}>
        <h1 className={styles.overlayTitle}>{frame.modalTitle}</h1>
        <p className={styles.overlayBody}>{frame.modalBody}</p>
      </div>

      <div className={styles.overlayActions}>
        <Button onClick={() => onSelect(frame.options[0])} size="lg">
          {frame.options[0]}
        </Button>
        <Button onClick={() => onSelect(frame.options[1])} size="lg" variant="secondary">
          {frame.options[1]}
        </Button>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlayReady, setOverlayReady] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const { say, stopSpeaking } = useMascot();
  const frame = FRAMES[currentIndex];
  const overlayOpen = overlayReady && !overlayDismissed;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    async function runFrame() {
      await say(frame.message, frame.tone);

      if (cancelled) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          setOverlayReady(true);
        }
      }, 1000);
    }

    void runFrame();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [currentIndex, frame.message, frame.tone, say]);

  function handleSelect() {
    setOverlayDismissed(true);
  }

  function handleBack() {
    stopSpeaking();
    setOverlayReady(false);
    setOverlayDismissed(false);
    setCurrentIndex((value) => Math.max(0, value - 1));
  }

  function handleNext() {
    stopSpeaking();
    setOverlayReady(false);
    setOverlayDismissed(false);
    setCurrentIndex((value) => Math.min(FRAMES.length - 1, value + 1));
  }

  return (
    <main className={styles.page}>
      <PhoneShell
        overlay={<Overlay frame={frame} onSelect={handleSelect} />}
        overlayOpen={overlayOpen}
      />

      <div className={styles.nav}>
        <Button
          className={styles.navButton}
          disabled={currentIndex === 0}
          onClick={handleBack}
          size="lg"
          variant="secondary"
        >
          Back
        </Button>
        <Button
          className={styles.navButton}
          disabled={currentIndex === FRAMES.length - 1}
          onClick={handleNext}
          size="lg"
        >
          Next
        </Button>
      </div>
    </main>
  );
}
