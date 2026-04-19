"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  MessageSquareText,
  PlaneTakeoff,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import mainStyles from "@/app/page.module.css";
import pageStyles from "./page.module.css";

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

export function ScenarioPhones() {
  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.phoneGrid}>
        <div className={[pageStyles.phoneStage, pageStyles.phoneStageRaised].join(" ")}>
          <ScenarioPhone
            bubbleTone="urgent"
            footer={
              <div className={mainStyles.sheetActions}>
                <a className={[mainStyles.actionButton].join(" ")} href={VISA_INFO.applicationUrl ?? "#"} rel="noreferrer" target="_blank">
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

        <div className={[pageStyles.phoneStage, pageStyles.phoneStageLowered].join(" ")}>
          <ScenarioPhone
            bubbleTone="empathetic"
            footer={
              <div className={mainStyles.sheetActions}>
                <button className={[mainStyles.actionButton].join(" ")} type="button">
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
  bubbleTone,
  footer,
  sheetContent,
  sheetTitle,
}: {
  bubbleTone: "urgent" | "empathetic";
  footer: ReactNode;
  sheetContent: ReactNode;
  sheetTitle: string;
}) {
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
              <div className={mainStyles.figure} data-speaking="false">
                <Image
                  alt="Lockey mascot"
                  height={280}
                  priority
                  src={bubbleTone === "urgent" ? "/mascot/confused.png" : "/mascot/greeting.png"}
                  style={{ width: "min(280px, 60vw)", height: "auto", position: "relative", zIndex: 1 }}
                  width={280}
                />
              </div>
            </div>
          </div>

          <div className={mainStyles.controls}>
            <button aria-label="Roadmap" className={[mainStyles.iconButton, mainStyles.sideButton, mainStyles.leftButton].join(" ")} type="button">
              <MessageSquareText size={22} />
            </button>
            <button aria-label="Voice" className={[mainStyles.iconButton, mainStyles.primaryButton].join(" ")} type="button">
              <MicIcon />
            </button>
            <button aria-label="Chat" className={[mainStyles.iconButton, mainStyles.sideButton, mainStyles.rightButton].join(" ")} type="button">
              <MessageCircleMoreIcon />
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
              {sheetTitle === "Embassy Communication" ? (
                <p className={pageStyles.sheetIntro}>Contact details and support brief, kept in the same in-app card style.</p>
              ) : null}
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
      title: visaRequired ? `${visaType} required` : "No visa blocker",
      body: leadDays != null ? `Apply at least ${leadDays} days before departure.` : visa?.notes ?? "Entry requirements are clear.",
      detail: visaRequired ? visa?.notes ?? "Check current consular processing times." : undefined,
      ctaLabel: applyUrl ? "Open visa form" : undefined,
      ctaHref: applyUrl,
    },
    {
      key: "hotel",
      tone: hotelOverCap ? "warn" : "ok",
      icon: <Building2 size={18} strokeWidth={2.1} />,
      title: hotelOverCap ? "Over nightly policy" : "Within nightly policy",
      body: `${hotelName ?? "Selected hotel"} - $${hotelNightlyRateUsd ?? hotelCapUsd}/night`,
      detail: hotelOverCap ? `$${hotelExcess} over the $${hotelCapUsd}/night cap.` : `Aligned with the $${hotelCapUsd}/night cap.`,
    },
    {
      key: "flight",
      tone: flightOverCap ? "warn" : "ok",
      icon: <PlaneTakeoff size={18} strokeWidth={2.1} />,
      title: flightOverCap ? "Price needs review" : "Flight approved",
      body: flightTotalUsd != null ? `${flightNumber ?? "Selected flight"} - $${flightTotalUsd}` : `Flight cap - $${flightCapUsd}`,
      detail: flightTotalUsd != null ? (flightOverCap ? `$${Math.round(flightTotalUsd - flightCapUsd)} above the approved cap.` : `Still within the $${flightCapUsd} cap.`) : undefined,
    },
    ...(nights > 0
      ? [
          {
            key: "stay",
            tone: (stayOverLimit ? "warn" : "ok") as "warn" | "ok",
            icon: <CalendarClock size={18} strokeWidth={2.1} />,
            title: stayOverLimit ? "Stay limit exceeded" : "Dates look compliant",
            body: `${nights} night trip${tripWindow ? ` - ${tripWindow}` : ""}`,
            detail: stayLimit != null ? (stayOverLimit ? `Over the ${stayLimit}-day entry window.` : `Within the ${stayLimit}-day entry window.`) : "No stay limit issue found.",
          },
        ]
      : []),
  ];

  const incomplete = checks.filter((item) => item.tone === "warn");
  const complete = checks.filter((item) => item.tone === "ok");

  return (
    <div className={mainStyles.cvList}>
      {incomplete.length > 0 ? (
        <div className={mainStyles.cvSection}>
          <div className={mainStyles.cvSectionLabel}>Needs Attention</div>
          {incomplete.map((item) => (
            <div className={mainStyles.cvRow} key={item.key}>
              <div className={[mainStyles.cvDot, mainStyles.cvDotWarn].join(" ")}>{item.icon}</div>
              <div>
                <div className={mainStyles.cvRowTitle}>{item.title}</div>
                <div className={mainStyles.cvRowSub}>
                  {item.body}
                  {item.detail ? ` - ${item.detail}` : ""}
                  {item.ctaHref && item.ctaLabel ? (
                    <>
                      {" "}
                      <Link className={mainStyles.applyLink} href={item.ctaHref} rel="noreferrer" target="_blank">
                        {item.ctaLabel}
                      </Link>
                    </>
                  ) : null}
                </div>
                {item.key === "visa" && visa?.visaRequired ? <VisaApplicationTimeline visa={visa} /> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {complete.length > 0 ? (
        <div className={mainStyles.cvSection}>
          <div className={mainStyles.cvSectionLabel}>Complete</div>
          {complete.map((item) => (
            <div className={mainStyles.cvRow} key={item.key}>
              <div className={[mainStyles.cvDot, mainStyles.cvDotOk].join(" ")}>{item.icon}</div>
              <div>
                <div className={mainStyles.cvRowTitle}>{item.title}</div>
                <div className={mainStyles.cvRowSub}>
                  {item.body}
                  {item.detail ? ` - ${item.detail}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VisaApplicationTimeline({ visa }: { visa: DemoVisaInfo }) {
  const visaType = visa?.visaType ?? "Required Visa";
  const leadDays = visa?.minApplicationLeadDays;
  const applyUrl = visa?.applicationUrl;

  const steps = [
    {
      title: "Complete online application",
      body: applyUrl ? `Apply for your ${visaType} at the official portal.` : `Contact the destination consulate to apply for your ${visaType}.`,
    },
    {
      title: "Gather required documents",
      body: "Bring a valid passport, invitation letter, hotel booking, flight itinerary, and employer support letter.",
    },
    {
      title: "Submit and await processing",
      body: leadDays != null ? `Allow at least ${leadDays} days for processing before departure.` : "Check with the consulate for current processing times.",
    },
  ];

  return (
    <div className={pageStyles.timelineWrap}>
      {steps.map((step, index) => (
        <div className={pageStyles.timelineItem} key={step.title}>
          <div className={pageStyles.timelineRail}>
            <span className={pageStyles.timelineDot} />
            {index < steps.length - 1 ? <span className={pageStyles.timelineLine} /> : null}
          </div>
          <div className={pageStyles.timelineContent}>
            <div className={pageStyles.timelineTitle}>{step.title}</div>
            <div className={pageStyles.timelineBody}>
              {step.body}
              {index === 0 && applyUrl ? (
                <>
                  {" "}
                  <Link className={mainStyles.applyLink} href={applyUrl} rel="noreferrer" target="_blank">
                    Apply here
                  </Link>
                </>
              ) : null}
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
      <div className={pageStyles.simpleCardStack}>
        <div className={pageStyles.simpleCard}>
          <div className={pageStyles.simpleCardLabel}>Nearest Embassy</div>
          <div className={pageStyles.simpleCardTitle}>{embassy.name}</div>
          <div className={pageStyles.simpleCardBody}>{embassy.address}</div>
          <div className={pageStyles.simpleCardMeta}>{embassy.hours}</div>
        </div>

        <div className={pageStyles.simpleCard}>
          <div className={pageStyles.simpleCardLabel}>Outbound Support Brief</div>
          <div className={pageStyles.simpleCardTitle}>Traveler support request: Lockey Thompson in Milan</div>
          <div className={pageStyles.simpleCardBody}>
            Lockey Thompson is traveling June 14 to June 21, 2026. The visa packet, hotel confirmation, and client
            invitation letter are attached and ready to share with support teams.
          </div>
          <div className={pageStyles.simpleCardMeta}>Travel desk escalation remains available 24 / 7.</div>
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

function MessageCircleMoreIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="26" viewBox="0 0 24 24" width="26">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M8 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M12 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M16 12h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
    </svg>
  );
}
