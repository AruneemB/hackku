"use client";

import Image from "next/image";
import Link from "next/link";
import React, { type ReactNode } from "react";
import {
  CalendarClock,
  Hotel as HotelIcon,
  MessageCircleMore as MessageCircleMoreIcon,
  MessageSquareText,
  PlaneTakeoff,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import mainStyles from "@/app/page.module.css";
import pageStyles from "./page.module.css";

// ── Types ──────────────────────────────────────────────────────

type DemoVisaInfo = {
  visaRequired: boolean;
  visaType: string | null;
  stayLimitDays: number;
  notes: string;
  applicationUrl: string | null;
  minApplicationLeadDays: number | null;
};

type EmbassyInfo = {
  name: string;
  address: string;
  hours: string;
};

// ── Demo data ──────────────────────────────────────────────────

const VISA_INFO: DemoVisaInfo = {
  visaRequired: true,
  visaType: "Type-C Business Visa",
  stayLimitDays: 30,
  notes: "Business travel requires a consular filing before departure for this scenario.",
  applicationUrl: "https://vistoperitalia.esteri.it/home/en",
  minApplicationLeadDays: 14,
};

const MILAN_EMBASSY: EmbassyInfo = {
  name: "US Consulate General Milan",
  address: "Via Principe Amedeo 2/10, Milan",
  hours: "Mon - Fri, 8:00 AM - 5:00 PM",
};

// ── Components ─────────────────────────────────────────────────

export function ScenarioPhones() {
  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.phoneGrid}>
        <div className={pageStyles.phoneStage}>
          <ScenarioPhone
            tone="urgent"
            footer={
              <div className={mainStyles.sheetActions}>
                <a
                  className={mainStyles.actionButton}
                  href={VISA_INFO.applicationUrl ?? "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  Apply Now
                </a>
                <button className={[mainStyles.actionButton, mainStyles.secondaryAction].join(" ")} type="button">
                  Dismiss
                </button>
              </div>
            }
            sheetContent={<VisaScenarioSheet />}
            sheetTitle="Visa Requirement"
          />
        </div>

        <div className={pageStyles.phoneStage}>
          <ScenarioPhone
            tone="empathetic"
            footer={
              <div className={mainStyles.sheetActions}>
                <button className={mainStyles.actionButton} type="button">
                  Got It
                </button>
                <button className={[mainStyles.actionButton, mainStyles.secondaryAction].join(" ")} type="button">
                  Close
                </button>
              </div>
            }
            sheetContent={<EmbassyScenarioSheet city="Milan" />}
            sheetTitle="Embassy Communication"
          />
        </div>
      </div>
    </main>
  );
}

function ScenarioPhone({
  tone,
  footer,
  sheetContent,
  sheetTitle,
}: {
  tone: "urgent" | "empathetic" | "neutral";
  footer: ReactNode;
  sheetContent: ReactNode;
  sheetTitle: string;
}) {
  const isUrgent = tone === "urgent";
  const mascotSrc = isUrgent || tone === "empathetic" ? "/mascot/confused.png" : "/mascot/greeting.png";

  return (
    <div className={[mainStyles.phone, pageStyles.phoneChrome].join(" ")}>
      <section className={[mainStyles.shell, pageStyles.shellViewport].join(" ")}>
        <div className={mainStyles.content}>
          <div className={mainStyles.topBar}>
            <button aria-label="Menu" className={mainStyles.menuButton} type="button">
              <MenuIcon />
            </button>
            <div />
          </div>

          <div className={mainStyles.stage}>
            <div className={mainStyles.mascot}>
              <div className={mainStyles.figure} data-speaking="true">
                <Image
                  alt="Lockey mascot"
                  height={280}
                  priority
                  src={mascotSrc}
                  style={{ width: "min(280px, 60vw)", height: "auto", position: "relative", zIndex: 1 }}
                  width={280}
                />
              </div>
            </div>
          </div>

          <div className={mainStyles.controls}>
            <button
              aria-label="Roadmap"
              className={[mainStyles.iconButton, mainStyles.sideButton, mainStyles.leftButton].join(" ")}
              type="button"
            >
              <MessageSquareText size={22} />
            </button>
            <button aria-label="Voice" className={[mainStyles.iconButton, mainStyles.primaryButton].join(" ")} type="button">
              <MicIcon />
            </button>
            <button
              aria-label="Chat"
              className={[mainStyles.iconButton, mainStyles.sideButton, mainStyles.rightButton].join(" ")}
              type="button"
            >
              <MessageCircleMoreIcon size={26} />
            </button>
          </div>
        </div>

        <div className={[mainStyles.sheetBackdrop, mainStyles.sheetBackdropVisible].join(" ")} />
        <div className={[mainStyles.sheet, mainStyles.sheetOpen, pageStyles.sheetSurface].join(" ")}>
          <div className={mainStyles.sheetDragArea}>
            <div className={mainStyles.sheetHandle} />
          </div>
          <div className={mainStyles.sheetScroll}>
            <div className={mainStyles.sheetContent}>
              <h2 className={mainStyles.sheetTitle}>{sheetTitle}</h2>
              {sheetTitle === "Embassy Communication" && (
                <p className={pageStyles.sheetIntro}>Contact details and support brief, kept in the same in-app card style.</p>
              )}
              {sheetContent}
            </div>
          </div>
          <div className={mainStyles.sheetFooter}>{footer}</div>
        </div>
      </section>
    </div>
  );
}

function VisaScenarioSheet() {
  return (
    <ComplianceReportRefined
      departure="2026-06-14"
      flightNumber="LH 8904"
      flightTotalUsd={687}
      hotelName="Marriott Scala"
      hotelNightlyRateUsd={247}
      returnDate="2026-06-21"
      visa={VISA_INFO}
    />
  );
}

function ComplianceReportRefined({
  visa,
  hotelName,
  hotelNightlyRateUsd,
  hotelCapUsd = 200,
  flightNumber,
  flightTotalUsd,
  flightCapUsd = 800,
  departure,
  returnDate,
}: {
  visa?: DemoVisaInfo | null;
  hotelName?: string;
  hotelNightlyRateUsd?: number;
  hotelCapUsd?: number;
  flightNumber?: string;
  flightTotalUsd?: number;
  flightCapUsd?: number;
  departure?: string;
  returnDate?: string;
}) {
  const visaRequired = visa?.visaRequired ?? false;
  const visaType = visa?.visaType ?? "Visa";
  const leadDays = visa?.minApplicationLeadDays ?? null;
  const applyUrl = visa?.applicationUrl ?? null;
  const hotelOverCap = hotelNightlyRateUsd != null && hotelNightlyRateUsd > hotelCapUsd;
  const hotelExcess = hotelNightlyRateUsd != null ? Math.round(hotelNightlyRateUsd - hotelCapUsd) : 0;
  const flightOverCap = flightTotalUsd != null && flightTotalUsd > flightCapUsd;

  let nights = 0;
  let tripWindow = "";
  if (departure && returnDate) {
    const dep = new Date(`${departure}T12:00:00`);
    const ret = new Date(`${returnDate}T12:00:00`);
    nights = Math.round((ret.getTime() - dep.getTime()) / 86_400_000);
    tripWindow = `${fmtDate(dep)} - ${fmtDate(ret)}`;
  }

  const stayLimit = visa?.stayLimitDays ?? null;
  const stayOverLimit = stayLimit != null && nights > stayLimit;

  const checks: Array<{
    key: string;
    tone: "warn" | "ok";
    icon: ReactNode;
    label: string;
    title: string;
    body: string;
    detail?: string;
    ctaLabel?: string;
    ctaHref?: string | null;
  }> = [
    {
      key: "visa",
      tone: visaRequired ? "warn" : "ok",
      icon: visaRequired ? <ShieldAlert size={18} strokeWidth={2.1} /> : <ShieldCheck size={18} strokeWidth={2.1} />,
      label: "Visa",
      title: visaRequired ? `${visaType} required` : "No visa blocker",
      body: leadDays != null ? `Apply at least ${leadDays} days before departure.` : visa?.notes ?? "Entry requirements are clear.",
      detail: visaRequired ? visa?.notes ?? "Check current consular processing times." : undefined,
      ctaLabel: applyUrl ? "Open visa form" : undefined,
      ctaHref: applyUrl,
    },
    {
      key: "hotel",
      tone: hotelOverCap ? "warn" : "ok",
      icon: <HotelIcon size={18} strokeWidth={2.1} />,
      label: "Hotel",
      title: hotelOverCap ? "Over nightly policy" : "Within nightly policy",
      body: `${hotelName ?? "Selected hotel"} · $${hotelNightlyRateUsd ?? hotelCapUsd}/night`,
      detail: hotelOverCap ? `$${hotelExcess} over the $${hotelCapUsd}/night cap.` : `Aligned with the $${hotelCapUsd}/night cap.`,
    },
    {
      key: "flight",
      tone: flightOverCap ? "warn" : "ok",
      icon: <PlaneTakeoff size={18} strokeWidth={2.1} />,
      label: "Flight",
      title: flightOverCap ? "Price needs review" : "Flight approved",
      body: flightTotalUsd != null ? `${flightNumber ?? "Selected flight"} · $${flightTotalUsd}` : `Flight cap · $${flightCapUsd}`,
      detail: flightTotalUsd != null ? (flightOverCap ? `$${Math.round(flightTotalUsd - flightCapUsd)} above the approved cap.` : `Still within the $${flightCapUsd} cap.`) : undefined,
    },
    ...(nights > 0
      ? [
          {
            key: "stay",
            tone: (stayOverLimit ? "warn" : "ok") as "warn" | "ok",
            icon: <CalendarClock size={18} strokeWidth={2.1} />,
            label: "Dates",
            title: stayOverLimit ? "Stay limit exceeded" : "Dates look compliant",
            body: `${nights} night trip${tripWindow ? ` · ${tripWindow}` : ""}`,
            detail: stayLimit != null ? (stayOverLimit ? `Over the ${stayLimit}-day entry window.` : `Within the ${stayLimit}-day entry window.`) : "No stay limit issue found.",
          },
        ]
      : []),
  ];

  return (
    <div className={mainStyles.cvList} style={{ gap: 28 }}>
      {checks.map((item) => (
        <div className={mainStyles.cvRow} key={item.key} style={{ gap: 14 }}>
          <div className={[mainStyles.cvDot, item.tone === "warn" ? mainStyles.cvDotWarn : mainStyles.cvDotOk].join(" ")} style={{ width: 32, height: 32 }}>
            {React.cloneElement(item.icon as React.ReactElement, { size: 16 })}
          </div>
          <div>
            <div className={mainStyles.cvRowTitle} style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
            <div className={mainStyles.cvRowSub} style={{ fontSize: 12, marginTop: 2 }}>
              {item.body}
              {item.detail ? `${item.body.endsWith('.') ? ' ' : ' · '}${item.detail}` : ""}
              {item.ctaHref && item.ctaLabel && (
                <>
                  {" "}
                  <Link className={mainStyles.applyLink} href={item.ctaHref} rel="noreferrer" target="_blank" style={{ fontSize: 12 }}>
                    {item.ctaLabel}
                  </Link>
                </>
              )}
            </div>
            {item.key === "visa" && visa?.visaRequired && <VisaApplicationTimeline visa={visa} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisaApplicationTimeline({ visa }: { visa: DemoVisaInfo }) {
  const visaType = visa?.visaType ?? "Required Visa";
  const leadDays = visa?.minApplicationLeadDays;
  const applyUrl = visa?.applicationUrl;

  const steps = [
    {
      title: "Complete application",
      body: applyUrl ? `Apply for your ${visaType} online.` : `Contact consulate.`,
    },
    {
      title: "Gather documents",
      body: "Passport, invitation, and employer letters.",
    },
    {
      title: "Submit",
      body: leadDays != null ? `Allow ${leadDays} days.` : "Check processing times.",
    },
  ];

  return (
    <div className={pageStyles.timelineWrap} style={{ marginTop: 10 }}>
      {steps.map((step, index) => (
        <div className={pageStyles.timelineItem} key={step.title}>
          <div className={pageStyles.timelineRail}>
            <span className={pageStyles.timelineDot} style={{ width: 8, height: 8 }} />
            {index < steps.length - 1 && <span className={pageStyles.timelineLine} style={{ minHeight: 28 }} />}
          </div>
          <div className={pageStyles.timelineContent} style={{ paddingBottom: 10 }}>
            <div className={pageStyles.timelineTitle} style={{ fontSize: 12, fontWeight: 600 }}>{step.title}</div>
            <div className={pageStyles.timelineBody} style={{ fontSize: 11, marginTop: 2 }}>
              {step.body}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmbassyScenarioSheet({ city }: { city: string }) {
  const embassy = getEmbassy(city);

  return (
    <div className={mainStyles.refinedSheet}>
      <div className={mainStyles.refinedGrid} style={{ gap: 14 }}>
        <div className={[mainStyles.refinedCard, mainStyles.refinedCardNeutral].join(" ")}>
          <div className={mainStyles.refinedCardTop}>
            <div className={mainStyles.refinedCardHeading}>
              <div className={mainStyles.refinedCardTitle} style={{ fontSize: 17, fontWeight: 700 }}>{embassy.name}</div>
            </div>
          </div>
          <div className={mainStyles.refinedCardBody} style={{ fontSize: 14 }}>{embassy.address}</div>
          <div className={mainStyles.refinedCardDetail} style={{ fontSize: 13 }}>{embassy.hours}</div>
        </div>

        <div className={[mainStyles.refinedCard, mainStyles.refinedCardNeutral].join(" ")}>
          <div className={mainStyles.refinedCardTop}>
            <div className={mainStyles.refinedCardHeading}>
              <div className={mainStyles.refinedCardTitle} style={{ fontSize: 17, fontWeight: 700 }}>Traveler support request</div>
            </div>
          </div>
          <div className={mainStyles.refinedCardBody} style={{ fontSize: 14 }}>
            Lockey Thompson in Milan (June 14-21). Visa packet, hotel booking, and client invitation letter ready.
          </div>
          <div className={mainStyles.refinedCardDetail} style={{ fontSize: 13 }}>Travel desk escalation available 24/7.</div>
        </div>
      </div>
    </div>
  );
}

function getEmbassy(city: string): EmbassyInfo {
  if (city.trim().toLowerCase() === "milan") return MILAN_EMBASSY;

  return {
    name: "Nearest US Embassy",
    address: "Visit travel.state.gov for the nearest embassy",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
  };
}

function fmtDate(value: Date) {
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 24 24" width="30">
      <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 12h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="36" viewBox="0 0 24 24" width="36">
      <rect height="13" rx="3" stroke="currentColor" strokeWidth="2" width="6" x="9" y="2" />
      <path d="M12 19v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
