"use client";

import { useEffect, useRef, useState } from "react";
import { Ellipsis, Pencil } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { useMascot } from "@/hooks/useMascot";
import type { Flight } from "@/types/flight";
import styles from "./page.module.css";

// ── Types ──────────────────────────────────────────────────────

type Tone = "neutral" | "excited" | "empathetic" | "urgent";

type TripData = {
  city: string;
  country: string;
  departure: string;
  returnDate: string;
  passportExpiry: string;
  purpose: string;
};

type ConversationMessage = { role: "user" | "assistant"; content: string };

type DemoFrame = {
  tone: Tone;
  message: string;
  sheetTitle: string;
  options: [string, string];
  Visual: React.ComponentType;
  actionTitle: string;
  ActionVisual: React.ComponentType;
};

type DemoProgressSnapshot = {
  version: 1;
  currentIndex: number;
  overlayReady: boolean;
  overlayDismissed: boolean;
  tripId: string | null;
  tripData: TripData | null;
  frameCompleted: Record<number, boolean>;
  conversationMessages: ConversationMessage[];
  knownFields: Record<string, string>;
  selectedFlight: number;
  selectedBundle: number | null;
};

// ── Demo data (hardcoded for unimplemented integrations) ───────

const DEMO_DEFAULTS: TripData = {
  city: "Milan",
  country: "IT",
  departure: "2025-09-14",
  returnDate: "2025-09-19",
  passportExpiry: "2025-01-01",
  purpose: "Client on-site meeting",
};

const DEMO_FLIGHTS = [
  { id: "lh8904", flightNumber: "LH 8904", carrier: "Lufthansa", route: "ORD → MXP", priceUsd: 687, dep: "8:45 AM", arr: "11:20 AM+1", dur: "9h 35m", stops: "Nonstop" },
  { id: "lx0117", flightNumber: "LX 0117", carrier: "Swiss", route: "ORD → ZRH → MXP", priceUsd: 543, dep: "6:15 AM", arr: "2:50 PM+1", dur: "10h 35m", stops: "1 stop" },
  { id: "af0264", flightNumber: "AF 0264", carrier: "Air France", route: "ORD → BGY", priceUsd: 412, dep: "10:30 AM", arr: "12:15 PM+1", dur: "8h 45m", stops: "Nonstop" },
];

type DisplayFlight = { id: string; flightNumber: string; carrier: string; route: string; priceUsd: number; dep: string; arr: string; dur: string; stops: string; tag?: string };

const CITY_TO_AIRPORT: Record<string, string> = {
  milan: "MXP", rome: "FCO", paris: "CDG", london: "LHR", tokyo: "NRT",
  "new york": "JFK", chicago: "ORD", dubai: "DXB", amsterdam: "AMS",
  frankfurt: "FRA", madrid: "MAD", barcelona: "BCN", lisbon: "LIS",
  singapore: "SIN", sydney: "SYD", toronto: "YYZ", zurich: "ZRH",
};

function fmtTime(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDur(min: number) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

const DEMO_HOTELS = [
  { id: "marriott-scala", name: "Marriott Scala", address: "Via della Spiga 31, Milan", pricePerNightUsd: 247, distanceKm: 0.4, isPreferred: true, confirmationNum: "MR-20250914-7741" },
  { id: "ac-hotel-milan", name: "AC Hotel Milan", address: "Via Larga 23, Milan", pricePerNightUsd: 189, distanceKm: 1.2, isPreferred: true, confirmationNum: "AC-20250914-9921" },
  { id: "nh-collection", name: "NH Collection", address: "Piazza Cavour 2, Milan", pricePerNightUsd: 165, distanceKm: 2.1, isPreferred: false, confirmationNum: "NH-20250914-3312" },
];

const DEMO_POLICY = {
  hotelNightlyCapUsd: 200,
  flightCapUsd: 800,
  mealAllowancePerDayUsd: 75,
  requiresManagerApproval: true,
  approvalReason: "Hotel at $247/night exceeds $200 Milan cap",
  mascotSummary: "Checked your company policy — no visa needed for US citizens in Italy, but Marriott Scala is $47 over the $200 cap and needs manager sign-off.",
};

const DEMO_PROGRESS_STORAGE_KEY = "hackku.demo.progress.v1";

const DEMO_BUNDLES = [
  { label: "A", description: "MXP direct · Marriott Scala. Full compliance, hotel exception needed.", flightId: "lh8904", hotelId: "marriott-scala", totalCostUsd: 2340, savingsVsStandard: 0, complianceFlags: ["hotel_over_cap"] },
  { label: "B", description: "BGY airport · AC Hotel 1.2 km. Saves $500. Fully compliant.", flightId: "af0264", hotelId: "ac-hotel-milan", totalCostUsd: 1840, savingsVsStandard: 500, complianceFlags: [] },
  { label: "C", description: "Weekend stay strategy · Marriott Scala. Best overall value.", flightId: "lh8904", hotelId: "marriott-scala", totalCostUsd: 2010, savingsVsStandard: 330, complianceFlags: [] },
];

const REBOOKED_FLIGHT = { id: "lh9012", flightNumber: "LH 9012", carrier: "Lufthansa", route: "ORD → MXP", priceUsd: 1067, dep: "9:00 PM", arr: "12:30 PM+1", dur: "9h 30m", stops: "Nonstop" };

const DEMO_RECEIPT = {
  merchant: "Ristorante Al Porto",
  category: "meal",
  total: "87.50",
  currency: "EUR",
  date: "2025-09-16T20:42:00.000Z",
  sanitized: true,
};

// ── MongoDB helpers ────────────────────────────────────────────

async function patchTrip(tripId: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Trip update failed");
}

async function executeFrameAction(
  frameIdx: number,
  tripId: string,
  sel: { flight: number; bundle: number | null; liveFlights?: Flight[] | null }
) {
  const flight = sel.liveFlights?.[sel.flight] ?? DEMO_FLIGHTS[sel.flight] ?? DEMO_FLIGHTS[0];
  const bundle = sel.bundle !== null ? DEMO_BUNDLES[sel.bundle] : DEMO_BUNDLES[2];

  switch (frameIdx) {
    case 1:
      await patchTrip(tripId, { flights: [flight] });
      break;
    case 2:
      await patchTrip(tripId, { hotels: [DEMO_HOTELS[0]] });
      break;
    case 3:
      await patchTrip(tripId, { policyFindings: DEMO_POLICY });
      break;
    case 4:
      await patchTrip(tripId, { selectedBundle: bundle });
      break;
    case 5:
      await patchTrip(tripId, {
        status: "pending_approval",
        approvalThread: { gmailThreadId: "demo-thread-001", status: "pending", reason: null },
      });
      break;
    case 6:
      await patchTrip(tripId, {
        hotels: [DEMO_HOTELS[1]],
        approvalThread: { gmailThreadId: "demo-thread-002", status: "pending", reason: null },
      });
      break;
    case 7:
      await patchTrip(tripId, { status: "approved" });
      break;
    case 8:
      await patchTrip(tripId, { status: "active" });
      break;
    case 9:
      await patchTrip(tripId, { flights: [REBOOKED_FLIGHT] });
      break;
    case 10:
      await patchTrip(tripId, {
        approvalThread: { gmailThreadId: "exception-thread-001", status: "pending", reason: "Emergency rebooking $380 over approved budget" },
      });
      break;
    case 11:
    case 13:
      break;
    case 12:
      await patchTrip(tripId, { receipts: [DEMO_RECEIPT] });
      break;
    case 14:
      await patchTrip(tripId, { status: "archived", totalSpendUsd: "2187.00" });
      break;
    default:
      break;
  }
}

async function revertFrameAction(frameIdx: number, tripId: string) {
  switch (frameIdx) {
    case 1:
      await patchTrip(tripId, { flights: [] });
      break;
    case 2:
      await patchTrip(tripId, { hotels: [] });
      break;
    case 3:
      await patchTrip(tripId, { policyFindings: null });
      break;
    case 4:
      await patchTrip(tripId, { selectedBundle: null });
      break;
    case 5:
      await patchTrip(tripId, {
        status: "draft",
        approvalThread: { gmailThreadId: null, status: null, reason: null },
      });
      break;
    case 6:
      await patchTrip(tripId, {
        hotels: [DEMO_HOTELS[0]],
        approvalThread: { gmailThreadId: "demo-thread-001", status: "rejected", reason: "Hotel exceeds $200 nightly cap" },
      });
      break;
    case 7:
      await patchTrip(tripId, { status: "pending_approval" });
      break;
    case 8:
      await patchTrip(tripId, { status: "approved" });
      break;
    case 9:
      await patchTrip(tripId, { flights: [DEMO_FLIGHTS[0]] });
      break;
    case 10:
      await patchTrip(tripId, {
        approvalThread: { gmailThreadId: "demo-thread-001", status: "approved", reason: null },
      });
      break;
    case 11:
    case 13:
      break;
    case 12:
      await patchTrip(tripId, { receipts: [] });
      break;
    case 14:
      await patchTrip(tripId, { status: "active", totalSpendUsd: "0" });
      break;
    default:
      break;
  }
}

function isPassportExpiringSoon(passportExpiry: string, departure: string): boolean {
  const expiry = new Date(passportExpiry);
  const dep = new Date(departure);
  dep.setMonth(dep.getMonth() - 6);
  return expiry <= dep;
}

// ── Visual components ──────────────────────────────────────────

function TripCard({ tripData }: { tripData?: TripData | null }) {
  const data = tripData ?? DEMO_DEFAULTS;
  const depDate = new Date(data.departure);
  const retDate = new Date(data.returnDate);
  const nights = Math.round((retDate.getTime() - depDate.getTime()) / 86400000);
  const depStr = depDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const retStr = retDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const expiryStr = new Date(data.passportExpiry).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const showWarning = isPassportExpiringSoon(data.passportExpiry, data.departure);
  const purpose = data.purpose ? toTitleCase(data.purpose) : "Not specified";

  return (
    <div className={styles.tripCard}>
      <div className={styles.tripDestination}>
        <div className={styles.tripCity}>{data.city}{data.country !== data.city ? `, ${data.country}` : ""}</div>
        <div className={styles.tripDates}>{depStr} to {retStr} · {nights} nights</div>
      </div>
      {showWarning && (
        <div className={styles.alertBox}>
          <span className={styles.alertIcon}>⚠️</span>
          <div>
            <div className={styles.alertTitle}>Passport expires {expiryStr}</div>
            <div className={styles.alertBody}>Within 6 months of travel — renewal recommended</div>
          </div>
        </div>
      )}
      <div className={styles.infoGrid}>
        {[
          ["Traveler", "Kelli Monroe"],
          ["Department", "Risk Management"],
          ["Purpose", purpose],
        ].map(([k, v]) => (
          <div className={styles.infoRow} key={k}>
            <span className={styles.infoKey}>{k}</span>
            <span className={styles.infoVal}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlightPicker({ value, onChange, flights }: { value?: number; onChange?: (i: number) => void; flights?: DisplayFlight[] | null }) {
  const [localSel, setLocalSel] = useState(0);
  const sel = value ?? localSel;
  const setSel = onChange ?? setLocalSel;
  const list = flights ?? DEMO_FLIGHTS;

  const tags: Record<number, string> = {};
  if (list.length > 0) {
    const firstTag = "tag" in list[0] && typeof list[0].tag === "string" ? list[0].tag : undefined;
    tags[0] = firstTag ?? "Best pick";
    const cheapest = list.reduce((ci, f, i) => f.priceUsd < list[ci].priceUsd ? i : ci, 0);
    if (cheapest !== 0) {
      const cheapestTag = "tag" in list[cheapest] && typeof list[cheapest].tag === "string"
        ? list[cheapest].tag
        : undefined;
      tags[cheapest] = cheapestTag ?? "Cheapest";
    }
  }

  return (
    <div className={styles.cards}>
      {list.map((f, i) => (
        <button
          className={[styles.card, sel === i ? styles.cardSelected : ""].join(" ")}
          key={f.id}
          onClick={() => setSel(i)}
          type="button"
        >
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>{f.flightNumber}</span>
            {tags[i] && <span className={styles.cardTag}>{tags[i]}</span>}
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardTime}>{f.dep} → {f.arr}</span>
            <span className={styles.cardPrice}>${f.priceUsd}</span>
          </div>
          <span className={styles.cardMeta}>{f.route} · {f.dur} · {f.stops}</span>
        </button>
      ))}
    </div>
  );
}

function FlightSearchState({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: string;
}) {
  return (
    <div className={styles.alertBox}>
      <span className={styles.alertIcon}>{icon}</span>
      <div>
        <div className={styles.alertTitle}>{title}</div>
        <div className={styles.alertBody}>{body}</div>
      </div>
    </div>
  );
}

function HotelMap() {
  const hotels = [
    { x: 115, label: "H1", name: "Marriott Scala", dist: "0.4 km", price: "$247/n" },
    { x: 193, label: "H2", name: "AC Hotel Milan", dist: "1.2 km", price: "$189/n" },
    { x: 273, label: "H3", name: "NH Collection", dist: "2.1 km", price: "$165/n" },
  ];
  return (
    <div className={styles.mapWrap}>
      <svg className={styles.mapSvg} viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#ede9e0" height="130" width="320" />
        {([[4,4,68,54],[82,4,68,54],[156,4,68,54],[234,4,80,54],[4,72,68,54],[82,72,68,54],[156,72,68,54],[234,72,80,54]] as number[][]).map(([x,y,w,h],i) => (
          <rect fill={i === 5 ? "#c8d8a0" : "#dad6cc"} height={h} key={i} rx="2" width={w} x={x} y={y} />
        ))}
        <rect fill="#fff" height="12" width="320" x="0" y="58" />
        <rect fill="#fff" height="130" width="10" x="76" y="0" />
        <rect fill="#fff" height="130" width="10" x="150" y="0" />
        <rect fill="#fff" height="130" width="10" x="228" y="0" />
        <line stroke="#e8c870" strokeDasharray="8,5" strokeWidth="1.5" x1="0" x2="320" y1="64" y2="64" />
        {hotels.map(h => (
          <line key={h.label} stroke="#f35b4f" strokeDasharray="4,3" strokeOpacity="0.4" strokeWidth="1.5" x1="38" x2={h.x} y1="30" y2="30" />
        ))}
        <circle cx="38" cy="30" fill="#1a2530" r="11" />
        <text fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle" x="38" y="34">★</text>
        {hotels.map(h => (
          <g key={h.label}>
            <circle cx={h.x} cy={30} fill="#f35b4f" r="11" />
            <text fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" x={h.x} y={34}>{h.label}</text>
            <text fill="#888" fontSize="8" textAnchor="middle" x={h.x} y={52}>{h.dist}</text>
          </g>
        ))}
      </svg>
      <div className={styles.mapLegend}>
        <div className={styles.mapLegendItem}><span className={styles.mapDotDark} />Client office</div>
        <div className={styles.mapLegendItem}><span className={styles.mapDotAccent} />Preferred hotels</div>
      </div>
      <div className={styles.hotelList}>
        {hotels.map(h => (
          <div className={styles.hotelRow} key={h.label}>
            <span className={styles.hotelBadge}>{h.label}</span>
            <span className={styles.hotelName}>{h.name}</span>
            <span className={styles.hotelDist}>{h.dist}</span>
            <span className={styles.hotelPrice}>{h.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplianceReport() {
  return (
    <div className={styles.complianceList}>
      <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
        <span className={styles.complianceIcon}>⚠️</span>
        <div>
          <div className={styles.complianceTitle}>Type-C Visa Required</div>
          <div className={styles.complianceBody}>US citizens must apply ≥ 15 days before departure</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
        <span className={styles.complianceIcon}>⚠️</span>
        <div>
          <div className={styles.complianceTitle}>Hotel Exception Needed</div>
          <div className={styles.complianceBody}>Marriott Scala at $247/night exceeds the $200 Milan cap</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Flight within budget</div>
          <div className={styles.complianceBody}>LH 8904 at $687 · approved cap is $800</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Travel dates policy-compliant</div>
          <div className={styles.complianceBody}>Sep 14 to 19 · 5-night stay · within 10-day maximum</div>
        </div>
      </div>
    </div>
  );
}

function ApprovalEmail() {
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Travel Approval - Milan, Sep 14-19</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p>I&#39;m requesting approval for a business trip to <strong>Milan, Italy, Sep 14-19, 2025</strong> for an on-site client meeting.</p>
        <p><strong>Flight:</strong> LH 8904, ORD to MXP · $687 (nonstop)<br />
        <strong>Hotel:</strong> Marriott Scala · $247/night x 5 = $1,235<br />
        <strong>Note:</strong> Hotel is $47 over the $200 cap - closest preferred vendor to client office.</p>
        <p>Total estimated: $2,010. Please let me know if you have any questions.</p>
        <p>Thanks,<br />Kelli</p>
      </div>
    </div>
  );
}

function HotelComparison() {
  return (
    <div className={styles.compareGrid}>
      <div className={[styles.compareCard, styles.compareRejected].join(" ")}>
        <div className={styles.compareBadge}>Rejected ✗</div>
        <div className={styles.compareName}>Marriott Scala</div>
        <div className={styles.comparePrice}>$247 / night</div>
        <div className={styles.compareMeta}>⭐ Preferred vendor</div>
        <div className={styles.compareMeta}>0.4 km from office</div>
        <div className={styles.compareReason}>$47 over the $200 cap</div>
      </div>
      <div className={[styles.compareCard, styles.compareApproved].join(" ")}>
        <div className={styles.compareBadge}>Alternative ✓</div>
        <div className={styles.compareName}>AC Hotel Milan</div>
        <div className={styles.comparePrice}>$189 / night</div>
        <div className={styles.compareMeta}>⭐ Preferred vendor</div>
        <div className={styles.compareMeta}>1.2 km from office</div>
        <div className={styles.compareReason}>Saves $290 total · fully compliant</div>
      </div>
    </div>
  );
}

function PrepChecklist() {
  const [done, setDone] = useState<Set<number>>(new Set());
  const items = [
    { text: "Apply for Type-C Visa at italyvisa.com", urgent: true },
    { text: "Renew passport after trip (expires Jan 2025)", urgent: true },
    { text: "Pack for 24°C, light rain expected on days 2 to 4" },
    { text: "Marriott Scala · Via della Spiga 31 · Check-in Sep 14 at 3:00 PM" },
    { text: "Confirm travel insurance coverage" },
  ];
  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }
  return (
    <div className={styles.checklist}>
      {items.map((item, i) => (
        <button
          className={[styles.checkItem, done.has(i) ? styles.checkDone : "", item.urgent ? styles.checkUrgent : ""].join(" ")}
          key={item.text}
          onClick={() => toggle(i)}
          type="button"
        >
          <span className={styles.checkBox}>{done.has(i) ? "✓" : ""}</span>
          <span className={styles.checkText}>{item.text}</span>
        </button>
      ))}
    </div>
  );
}

function LiveDashboard() {
  return (
    <div className={styles.dashboard}>
      {[
        { icon: "✈️", title: "LH 8904 · Gate B22", sub: "Boards 8:15 AM · Departs 8:45 AM", badge: "On time" },
        { icon: "🌤️", title: "Milan · 24 °C", sub: "Partly cloudy · Low 18 °C tonight", badge: "" },
        { icon: "🏨", title: "Marriott Scala · Room 412", sub: "Check-in ready from 3:00 PM", badge: "Ready" },
        { icon: "🚗", title: "Traffic to MXP · 32 min", sub: "Leave by 7:00 AM to make your gate", badge: "" },
      ].map(item => (
        <div className={styles.dashCard} key={item.title}>
          <span className={styles.dashIcon}>{item.icon}</span>
          <div className={styles.dashText}>
            <div className={styles.dashTitle}>{item.title}</div>
            <div className={styles.dashSub}>{item.sub}</div>
          </div>
          {item.badge && <span className={styles.dashBadge}>{item.badge}</span>}
        </div>
      ))}
    </div>
  );
}

function FlightRebooking() {
  return (
    <div className={styles.rebooking}>
      <div className={[styles.rebookCard, styles.rebookOld].join(" ")}>
        <div className={styles.rebookBadge}>Original · Cancelled ✗</div>
        <div className={styles.rebookFlight}>LH 8904 &nbsp;·&nbsp; ORD → MXP</div>
        <div className={styles.rebookTime}>Departs 8:45 AM</div>
        <div className={styles.rebookMeta}>Thunderstorm at ORD · missed connection</div>
      </div>
      <div className={styles.rebookArrow}>↓ rebooked automatically</div>
      <div className={[styles.rebookCard, styles.rebookNew].join(" ")}>
        <div className={styles.rebookBadge}>New booking · Confirmed ✓</div>
        <div className={styles.rebookFlight}>LH 9012 &nbsp;·&nbsp; ORD → MXP</div>
        <div className={styles.rebookTime}>Departs 9:00 PM</div>
        <div className={styles.rebookMeta}>Same carrier · No change fee · Seat 14A · Hotel notified ✓</div>
      </div>
    </div>
  );
}

function ExceptionEmail() {
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Priority</span><span className={[styles.emailVal, styles.emailUrgent].join(" ")}>HIGH - Action required</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Emergency Exception - Milan Rebooking</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p><strong>LH 8904 was cancelled due to a thunderstorm</strong> at O&#39;Hare. The only available rebooking is LH 9012 at <strong>$1,067</strong>, which is $380 over the approved $687 budget.</p>
        <p>Force majeure - requesting emergency exception. Hotel hold expires in 2 hours.</p>
        <p>Kelli</p>
      </div>
    </div>
  );
}

function ArrivalSupport() {
  const [sel, setSel] = useState<number | null>(null);
  const options = [
    { icon: "🚕", name: "Company taxi", time: "18 min", cost: "$14", preferred: true },
    { icon: "🚇", name: "Metro M1 → M3", time: "35 min", cost: "$2.50", preferred: false },
    { icon: "🚶", name: "Walk", time: "28 min", cost: "Free", preferred: false },
  ];
  return (
    <div className={styles.arrival}>
      <div className={styles.arrivalDest}>
        <span className={styles.arrivalPin}>📍</span>
        <div>
          <div className={styles.arrivalName}>Marriott Scala</div>
          <div className={styles.arrivalAddr}>Via della Spiga 31, Milan · 2.3 km from MXP</div>
        </div>
      </div>
      <div className={styles.cards}>
        {options.map((o, i) => (
          <button className={[styles.card, sel === i ? styles.cardSelected : ""].join(" ")} key={o.name} onClick={() => setSel(i)} type="button">
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>{o.icon}  {o.name}</span>
              {o.preferred && <span className={styles.cardTag}>Preferred</span>}
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardMeta}>{o.time}</span>
              <span className={styles.cardPrice}>{o.cost}</span>
            </div>
          </button>
        ))}
      </div>
      <div className={styles.allowanceRow}>
        <span>💰 Meal allowance today</span>
        <strong>$75 remaining</strong>
      </div>
    </div>
  );
}

function ReceiptCapture() {
  return (
    <div className={styles.receipt}>
      <div className={styles.receiptHead}>
        <div className={styles.receiptMerchant}>Ristorante Al Porto</div>
        <div className={styles.receiptSub}>Via Serbelloni 3, Milan</div>
        <div className={styles.receiptSub}>September 16, 2025 · 8:42 PM</div>
      </div>
      <div className={styles.receiptLines}>
        {[
          ["Antipasto misto", "€18.00"],
          ["Risotto alla Milanese", "€24.50"],
          ["Vino della casa", "€22.00"],
          ["Acqua naturale", "€6.00"],
          ["Coperto (2 pax)", "€3.00"],
        ].map(([item, price]) => (
          <div className={styles.receiptLine} key={item}>
            <span>{item}</span><span>{price}</span>
          </div>
        ))}
      </div>
      <div className={styles.receiptTotal}>
        <span>TOTAL</span><span>€87.50</span>
      </div>
      <div className={styles.receiptTags}>
        <span className={styles.receiptTag}>✓ Categorized: Meals</span>
        <span className={styles.receiptTag}>✓ PII sanitized</span>
      </div>
    </div>
  );
}

function ContactCards() {
  return (
    <div className={styles.contactCards}>
      <div className={styles.contactCard}>
        <div className={styles.contactEmoji}>📞</div>
        <div className={styles.contactBody}>
          <div className={styles.contactName}>Corporate Travel Desk</div>
          <div className={styles.contactDetail}>+1 (800) 555-0199</div>
          <div className={styles.contactDetail}>Available 24 / 7</div>
        </div>
      </div>
      <div className={styles.contactCard}>
        <div className={styles.contactEmoji}>🏛️</div>
        <div className={styles.contactBody}>
          <div className={styles.contactName}>US Embassy Milan</div>
          <div className={styles.contactDetail}>Via Principe Amedeo 2/10</div>
          <div className={styles.contactDetail}>Mon to Fri · 8:00 AM to 5:00 PM</div>
        </div>
      </div>
    </div>
  );
}

function SpendSummary() {
  const cats = [
    { name: "Flights", spent: 687, budget: 800 },
    { name: "Hotel (5 nights)", spent: 945, budget: 1000 },
    { name: "Meals", spent: 312, budget: 375 },
    { name: "Transport", spent: 243, budget: 165 },
  ];
  const total = cats.reduce((a, c) => a + c.spent, 0);
  const approved = 2340;
  return (
    <div className={styles.spend}>
      <div className={styles.spendHeader}>
        <span className={styles.spendTotal}>${total.toLocaleString()}</span>
        <span className={styles.spendMeta}>of ${approved.toLocaleString()} approved &nbsp;·&nbsp; <strong className={styles.spendUnder}>${approved - total} under</strong></span>
      </div>
      <div className={styles.spendBar}><div className={styles.spendFill} style={{ width: `${Math.round((total / approved) * 100)}%` }} /></div>
      <div className={styles.spendItems}>
        {cats.map(c => (
          <div className={styles.spendItem} key={c.name}>
            <span className={styles.spendName}>{c.name}</span>
            <div className={styles.spendItemBar}><div className={[styles.spendItemFill, c.spent > c.budget ? styles.spendOver : ""].join(" ")} style={{ width: `${Math.min(100, Math.round((c.spent / c.budget) * 100))}%` }} /></div>
            <span className={[styles.spendAmt, c.spent > c.budget ? styles.spendOver : ""].join(" ")}>${c.spent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacySummary() {
  return (
    <div className={styles.privacyList}>
      {[
        { icon: "📍", label: "Location tracking", detail: "Active Sep 14 to 19 only", status: "Stopped" },
        { icon: "💳", label: "Financial data", detail: "Card numbers sanitized before storage", status: "Done" },
        { icon: "🔑", label: "OAuth tokens", detail: "Encrypted at rest in Atlas", status: "Secured" },
        { icon: "📅", label: "Data retention", detail: "90-day policy per company guidelines", status: "Expires Dec 18" },
      ].map(item => (
        <div className={styles.privacyItem} key={item.label}>
          <span className={styles.privacyIcon}>{item.icon}</span>
          <div className={styles.privacyBody}>
            <div className={styles.privacyLabel}>{item.label}</div>
            <div className={styles.privacyDetail}>{item.detail}</div>
          </div>
          <span className={styles.privacyStatus}>{item.status}</span>
        </div>
      ))}
    </div>
  );
}

function BundlePicker({ value, onChange }: { value?: number | null; onChange?: (i: number) => void }) {
  const [localSel, setLocalSel] = useState<number | null>(null);
  const sel = value !== undefined ? value : localSel;
  const setSel = onChange ?? setLocalSel;
  const bundles = [
    { name: "Path A", badge: "Policy-safe", price: "$2,340", detail: "MXP direct · Marriott Scala", note: "Requires hotel sign-off" },
    { name: "Path B", badge: "Save $500", price: "$1,840", detail: "BGY airport · AC Hotel 1.2 km", note: "Fully compliant, no exceptions" },
    { name: "Path C", badge: "⚡ Recommended", price: "$2,010", detail: "Weekend stay · Marriott Scala", note: "Best overall value" },
  ];
  return (
    <div className={styles.cards}>
      {bundles.map((b, i) => (
        <button className={[styles.card, sel === i ? styles.cardSelected : ""].join(" ")} key={b.name} onClick={() => setSel(i)} type="button">
          <div className={styles.cardRow}>
            <span className={styles.cardMain}>{b.name}</span>
            <span className={[styles.cardTag, sel === i ? styles.cardTagSelected : ""].join(" ")}>{b.badge}</span>
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardMeta}>{b.detail}</span>
            <span className={styles.cardPrice}>{b.price}</span>
          </div>
          <span className={styles.cardNote}>{b.note}</span>
        </button>
      ))}
    </div>
  );
}

// ── Action visual components ────────────────────────────────────

function TripConfirmed() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>✅</span>
        <div className={styles.confirmTitle}>Trip Draft Saved</div>
        <div className={styles.confirmBody}>Milan · Sep 14 to 19 · Trip #TRP-20250914 is now active in your travel dashboard.</div>
      </div>
    </div>
  );
}

function FlightConfirmed() {
  return (
    <div className={styles.eticket}>
      <div className={styles.eticketRow}>
        <div className={styles.eticketAirport}><div className={styles.eticketCode}>ORD</div><div className={styles.eticketCity}>Chicago</div></div>
        <div className={styles.eticketPlane}>✈</div>
        <div className={[styles.eticketAirport, styles.eticketAirportRight].join(" ")}><div className={styles.eticketCode}>MXP</div><div className={styles.eticketCity}>Milan</div></div>
      </div>
      <div className={styles.eticketGrid}>
        {[["Flight","LH 8904"],["Date","Sep 14, 2025"],["Departs","8:45 AM"],["Seat","14A (Window)"],["PNR","XKMR74"],["Class","Economy"]].map(([k,v]) => (
          <div className={styles.eticketItem} key={k}><div className={styles.eticketKey}>{k}</div><div className={styles.eticketVal}>{v}</div></div>
        ))}
      </div>
    </div>
  );
}

function HotelConfirmed() {
  return (
    <div className={styles.confirmList}>
      {[
        { icon: "🏨", label: "Hotel", val: "Marriott Scala, Milan" },
        { icon: "📅", label: "Check-in", val: "Sep 14 · 3:00 PM" },
        { icon: "📅", label: "Check-out", val: "Sep 19 · 12:00 noon" },
        { icon: "🔑", label: "Conf. #", val: "MR-20250914-7741" },
        { icon: "💰", label: "Total", val: "$1,235 (5 nights)" },
      ].map(item => (
        <div className={styles.confirmRow} key={item.label}>
          <span className={styles.confirmIcon}>{item.icon}</span>
          <span className={styles.confirmLabel}>{item.label}</span>
          <span className={styles.confirmVal}>{item.val}</span>
        </div>
      ))}
    </div>
  );
}

function VisaGuide() {
  const [open, setOpen] = useState<number | null>(0);
  const steps = [
    { n: "1", title: "Complete online application", body: "Italian Consulate portal, select 'Schengen Short Stay (Type C), Business'" },
    { n: "2", title: "Gather required documents", body: "Valid passport, invitation letter, travel insurance, hotel booking, flight itinerary, bank statements" },
    { n: "3", title: "Book your appointment", body: "Italian Consulate Chicago, 500 N Michigan Ave. Allow at least 15 days for processing" },
    { n: "4", title: "Pay the fee and submit", body: "80 EUR application fee. Bring originals and copies to your appointment" },
  ];
  return (
    <div className={styles.guideWrap}>
      <div className={styles.guideSteps}>
        {steps.map((step, i) => (
          <div className={styles.stepItem} key={step.n}>
            <button className={styles.stepHeader} onClick={() => setOpen(open === i ? null : i)} type="button">
              <span className={styles.stepNum}>{step.n}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepChevron}>{open === i ? "▲" : "▼"}</span>
            </button>
            {open === i && <div className={styles.stepBody}>{step.body}</div>}
          </div>
        ))}
      </div>
      <div className={styles.guideLink}>italyvisa.com · Italian Consulate Chicago</div>
    </div>
  );
}

function BundleConfirmed() {
  return (
    <div className={styles.itinerary}>
      <div className={styles.itineraryHeader}>
        <div className={styles.itineraryTitle}>Path C · Confirmed</div>
        <div className={styles.itineraryTotal}>$2,010</div>
      </div>
      {[
        { icon: "✈️", label: "Flight", val: "LH 8904 · ORD → MXP", sub: "Sep 14 · 8:45 AM · $687" },
        { icon: "🏨", label: "Hotel", val: "Marriott Scala · 5 nights", sub: "Sep 14 to 19 · $1,235" },
        { icon: "📋", label: "Approval", val: "Pending manager sign-off", sub: "mgr.sarah@lockton.com" },
      ].map(item => (
        <div className={styles.itineraryRow} key={item.label}>
          <span className={styles.itineraryIcon}>{item.icon}</span>
          <div>
            <div className={styles.itineraryLabel}>{item.val}</div>
            <div className={styles.itinerarySub}>{item.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalWatching() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>📬</span>
        <div className={styles.confirmTitle}>Watching for Reply</div>
        <div className={styles.confirmBody}>Email sent to mgr.sarah@lockton.com. I&#39;ll notify you the moment she responds.</div>
      </div>
      <div className={styles.watchStatus}>
        <div className={styles.watchDot} />
        <span>Monitoring inbox · Last checked just now</span>
      </div>
    </div>
  );
}

function ResubmitEmail() {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className={styles.sentBanner}>
        <span>✓</span>
        <span>Resubmission sent to mgr.sarah@lockton.com</span>
      </div>
    );
  }
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Updated - Milan Approval, Hotel Revised</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p>Following your feedback, I&#39;ve switched to <strong>AC Hotel Milan at $189/night</strong> — fully within the $200 cap. Total drops to $1,840.</p>
        <p>Everything else is the same. Please let me know if you&#39;re happy to approve.</p>
        <p>Thanks,<br />Kelli</p>
      </div>
      <button className={styles.emailSend} onClick={() => setSent(true)} type="button">Send Updated Request</button>
    </div>
  );
}

function TripReady() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>🎒</span>
        <div className={styles.confirmTitle}>You&#39;re Ready to Travel</div>
        <div className={styles.confirmBody}>All checklist items reviewed. Documents, bookings, and reminders are in order.</div>
      </div>
      <div className={styles.countdownCard}>
        <div className={styles.countdownNum}>12</div>
        <div className={styles.countdownLabel}>days until departure</div>
      </div>
    </div>
  );
}

function LiveConfirmed() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>📡</span>
        <div className={styles.confirmTitle}>Live Monitoring Active</div>
        <div className={styles.confirmBody}>Gate, weather, hotel, and traffic updates will push to your device automatically throughout the trip.</div>
      </div>
      <div className={styles.watchStatus}>
        <div className={styles.watchDot} />
        <span>Updating every 60 seconds</span>
      </div>
    </div>
  );
}

function RebookingConfirmed() {
  return (
    <div className={styles.eticket}>
      <div className={styles.eticketRow}>
        <div className={styles.eticketAirport}><div className={styles.eticketCode}>ORD</div><div className={styles.eticketCity}>Chicago</div></div>
        <div className={styles.eticketPlane}>✈</div>
        <div className={[styles.eticketAirport, styles.eticketAirportRight].join(" ")}><div className={styles.eticketCode}>MXP</div><div className={styles.eticketCity}>Milan</div></div>
      </div>
      <div className={styles.eticketGrid}>
        {[["Flight","LH 9012"],["Date","Sep 14, 2025"],["Departs","9:00 PM"],["Seat","14A (Window)"],["PNR","XKMR74"],["Change fee","None"]].map(([k,v]) => (
          <div className={styles.eticketItem} key={k}><div className={styles.eticketKey}>{k}</div><div className={styles.eticketVal}>{v}</div></div>
        ))}
      </div>
      <div className={[styles.eticketBadge, styles.eticketBadgeGreen].join(" ")}>Hotel notified · No further action needed</div>
    </div>
  );
}

function ExceptionPending() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>⏳</span>
        <div className={styles.confirmTitle}>Exception Pending</div>
        <div className={styles.confirmBody}>Urgent request sent. Sarah typically responds within 30 minutes for force majeure cases.</div>
      </div>
      <div className={styles.watchStatus}>
        <div className={styles.watchDotUrgent} />
        <span>Monitoring inbox · Hotel hold expires in 2 hours</span>
      </div>
    </div>
  );
}

function TransportConfirmed() {
  return (
    <div className={styles.confirmList}>
      {[
        { icon: "🚕", label: "Transport", val: "Company taxi" },
        { icon: "📍", label: "Pickup", val: "MXP Arrivals Hall B" },
        { icon: "🏨", label: "Drop-off", val: "Marriott Scala, Milan" },
        { icon: "⏱", label: "ETA", val: "18 min · $14" },
        { icon: "📞", label: "Driver", val: "+39 02 555 0122" },
      ].map(item => (
        <div className={styles.confirmRow} key={item.label}>
          <span className={styles.confirmIcon}>{item.icon}</span>
          <span className={styles.confirmLabel}>{item.label}</span>
          <span className={styles.confirmVal}>{item.val}</span>
        </div>
      ))}
    </div>
  );
}

function ReceiptSubmitted() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>✅</span>
        <div className={styles.confirmTitle}>Submitted to Expense System</div>
        <div className={styles.confirmBody}>Ristorante Al Porto · €87.50 · Ref #EXP-20250916-09 · Categorized as &quot;Meals&quot;</div>
      </div>
      <div className={styles.receiptTags}>
        <span className={styles.receiptTag}>✓ Within daily allowance</span>
        <span className={styles.receiptTag}>✓ Manager notified</span>
      </div>
    </div>
  );
}

function ContactsSaved() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>📱</span>
        <div className={styles.confirmTitle}>Contacts Saved</div>
        <div className={styles.confirmBody}>Corporate Travel Desk and US Embassy Milan added to your emergency contacts for this trip.</div>
      </div>
    </div>
  );
}

function TripArchived() {
  return (
    <div className={styles.archiveWrap}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>📁</span>
        <div className={styles.confirmTitle}>Trip #TRP-20250914 Archived</div>
        <div className={styles.confirmBody}>Expense report drafted and sent to mgr.sarah@lockton.com for final sign-off.</div>
      </div>
      <div className={styles.archiveSummary}>
        {[["Total spent","$2,187"],["Under budget by","$153"],["Receipts logged","7"],["Days on trip","5"]].map(([k,v]) => (
          <div className={styles.archiveRow} key={k}>
            <span className={styles.archiveKey}>{k}</span>
            <span className={styles.archiveVal}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataCleared() {
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>🔒</span>
        <div className={styles.confirmTitle}>Your Data Is Protected</div>
        <div className={styles.confirmBody}>Location tracking stopped. Financial data sanitized. OAuth tokens expired. Trip data scheduled for deletion Dec 18.</div>
      </div>
    </div>
  );
}

// ── Frame definitions ──────────────────────────────────────────

const FRAMES: DemoFrame[] = [
  { tone: "excited", message: "Hey there! Tell me where you're headed, your travel dates, and what's bringing you there and I'll get your trip started.", sheetTitle: "Your Trip", options: ["Looks Right", "Adjust"], Visual: TripCard, actionTitle: "Trip Confirmed", ActionVisual: TripConfirmed },
  { tone: "excited", message: "I've scanned nearby airports and a five-day window to find you the best flight options. Take a look!", sheetTitle: "Choose a Flight", options: ["Confirm Flight", "Adjust"], Visual: FlightPicker, actionTitle: "Your E-Ticket", ActionVisual: FlightConfirmed },
  { tone: "excited", message: "I've found hotels near the client office and flagged the preferred vendors for you. Which one feels right?", sheetTitle: "Hotels Near Client Office", options: ["Looks Right", "Adjust"], Visual: HotelMap, actionTitle: "Hotel Booked", ActionVisual: HotelConfirmed },
  { tone: "empathetic", message: "I ran a compliance check and found two things to sort out. You'll need a Type-C visa, and the hotel requires a quick approval.", sheetTitle: "Compliance Check Complete", options: ["Apply for Visa", "Adjust"], Visual: ComplianceReport, actionTitle: "Visa Application Guide", ActionVisual: VisaGuide },
  { tone: "excited", message: "Here are three ways to bundle your trip. I can optimize for policy compliance, cost savings, or proximity to the office.", sheetTitle: "Choose Your Bundle", options: ["Confirm Bundle", "Adjust"], Visual: BundlePicker, actionTitle: "Itinerary Confirmed", ActionVisual: BundleConfirmed },
  { tone: "neutral", message: "I've drafted the approval email and set up a watch on your manager's thread so nothing slips through.", sheetTitle: "Approval Request Ready", options: ["Send", "Edit Draft"], Visual: ApprovalEmail, actionTitle: "Approval Sent", ActionVisual: ApprovalWatching },
  { tone: "empathetic", message: "Your manager flagged the hotel cost. I've found a compliant lower-cost option that should get the green light.", sheetTitle: "Recovery Option Prepared", options: ["Resubmit", "Adjust"], Visual: HotelComparison, actionTitle: "Resubmitting to Manager", ActionVisual: ResubmitEmail },
  { tone: "excited", message: "Your trip's approved! I've put together your checklist, visa link, and packing reminders so you're ready to go.", sheetTitle: "Your Travel Checklist", options: ["All Set", "Adjust"], Visual: PrepChecklist, actionTitle: "All Packed!", ActionVisual: TripReady },
  { tone: "neutral", message: "Live mode's on. I'm tracking your gate, the weather, hotel status, and travel conditions in real time.", sheetTitle: "Live Travel Mode", options: ["Looks Right", "Adjust"], Visual: LiveDashboard, actionTitle: "You're Covered", ActionVisual: LiveConfirmed },
  { tone: "urgent", message: "Heads up, there's a storm causing delays. I've already rebooked you on a later flight and notified your hotel.", sheetTitle: "Disruption Handled", options: ["Accept Rebooking", "Adjust"], Visual: FlightRebooking, actionTitle: "New E-Ticket", ActionVisual: RebookingConfirmed },
  { tone: "urgent", message: "The only available rebooking is over budget. I've drafted an emergency exception request to send your manager right now.", sheetTitle: "Emergency Exception", options: ["Send", "Edit Draft"], Visual: ExceptionEmail, actionTitle: "Exception Requested", ActionVisual: ExceptionPending },
  { tone: "excited", message: "Welcome to Milan! Here's the fastest way to your hotel and your daily meal allowance to keep you covered.", sheetTitle: "On-the-Ground Support", options: ["Got It", "Adjust"], Visual: ArrivalSupport, actionTitle: "Transport Booked", ActionVisual: TransportConfirmed },
  { tone: "neutral", message: "Point the camera at your receipt and I'll pull out the merchant name, total, and date automatically.", sheetTitle: "Receipt Captured", options: ["Looks Right", "Adjust"], Visual: ReceiptCapture, actionTitle: "Receipt Logged", ActionVisual: ReceiptSubmitted },
  { tone: "empathetic", message: "Some situations need a real person. Here's the corporate travel desk and the nearest embassy, ready when you need them.", sheetTitle: "Human Support Contacts", options: ["Got It", "Dismiss"], Visual: ContactCards, actionTitle: "Contacts Saved", ActionVisual: ContactsSaved },
  { tone: "excited", message: "Great trip! I've tallied up your final spend and put the expense report together. Ready to wrap it up?", sheetTitle: "Trip Spend Summary", options: ["Archive Trip", "Review"], Visual: SpendSummary, actionTitle: "Trip Archived", ActionVisual: TripArchived },
  { tone: "neutral", message: "Here's a clear breakdown of how your travel data was used, what was shared, and how it's protected.", sheetTitle: "Privacy & Data Summary", options: ["Done", "Adjust"], Visual: PrivacySummary, actionTitle: "Data Protected", ActionVisual: DataCleared },
];

// ── Icons ──────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 24 24" width="30">
      <path d="M4 7h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 12h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function MicIcon({ active }: { active?: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" height="36" viewBox="0 0 24 24" width="36">
      <rect height="13" rx="3" stroke={active ? "#f35b4f" : "currentColor"} strokeWidth="2" width="6" x="9" y="2" />
      <path d="M12 19v3" stroke={active ? "#f35b4f" : "currentColor"} strokeLinecap="round" strokeWidth="2" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={active ? "#f35b4f" : "currentColor"} strokeLinecap="round" strokeWidth="2" />
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

// ── Audio visualizer ──────────────────────────────────────────

function AudioBars({ analyserNode }: { analyserNode: AnalyserNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = new Uint8Array(analyserNode.frequencyBinCount);
    let frameId: number;

    function draw() {
      analyserNode.getByteFrequencyData(data);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const count = 5;
      const bw = 4, gap = 3;
      const totalW = count * bw + (count - 1) * gap;
      const sx = (canvas!.width - totalW) / 2;
      const maxH = canvas!.height - 8;

      for (let i = 0; i < count; i++) {
        const idx = Math.floor((i / count) * (data.length * 0.35));
        const vol = data[idx] / 255;
        const idle = Math.sin(Date.now() / 280 + i * 1.3) * 0.07 + 0.06;
        const h = Math.max(4, (vol * 0.9 + idle) * maxH);
        const x = sx + i * (bw + gap);
        const y = (canvas!.height - h) / 2;

        ctx!.fillStyle = "rgba(255,255,255,0.92)";
        ctx!.beginPath();
        if (typeof ctx!.roundRect === "function") {
          ctx!.roundRect(x, y, bw, h, 2);
        } else {
          ctx!.rect(x, y, bw, h);
        }
        ctx!.fill();
      }

      frameId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frameId);
  }, [analyserNode]);

  return <canvas height={36} ref={canvasRef} style={{ display: "block" }} width={36} />;
}

// ── PhoneShell ────────────────────────────────────────────────

function PhoneShell({
  sheetScrollContent,
  sheetFooter,
  sheetOpen,
  onSheetClose,
  showEllipsis,
  onEllipsisOpen,
  isListening,
  isProcessing,
  onMicClick,
  analyserNode,
}: {
  sheetScrollContent: React.ReactNode;
  sheetFooter: React.ReactNode;
  sheetOpen: boolean;
  onSheetClose: () => void;
  showEllipsis: boolean;
  onEllipsisOpen: () => void;
  isListening: boolean;
  isProcessing: boolean;
  onMicClick: () => void;
  analyserNode: AnalyserNode | null;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragging = useRef(false);

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    dragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dy = Math.max(0, e.clientY - dragStartY.current);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    const dy = Math.max(0, e.clientY - dragStartY.current);
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform = "";
    }
    if (dy > 100) onSheetClose();
  }

  function handlePointerCancel() {
    dragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "";
      sheetRef.current.style.transform = "";
    }
  }

  return (
    <div className={styles.phone}>
      <section className={styles.shell}>
        <div className={styles.content}>
          <button aria-label="Open menu" className={styles.menuButton} type="button">
            <MenuIcon />
          </button>
          <div className={styles.stage}>
            <Mascot bubbleClassName={styles.speech} bubblePosition="below" bubbleSize="lg" bubbleVariant="plain" className={styles.mascot} figureClassName={styles.figure} />
            <div className={styles.ellipsisSlot}>
              {showEllipsis && (
                <button aria-label="View details" className={styles.ellipsisButton} onClick={onEllipsisOpen} type="button">
                  <Ellipsis size={18} />
                </button>
              )}
            </div>
          </div>
          <div className={styles.controls}>
            <button aria-label="Trip planning unavailable" className={[styles.iconButton, styles.sideButton, styles.leftButton, styles.disabledButton].join(" ")} disabled type="button">
              <Pencil size={22} />
            </button>
            <button
              aria-label={isListening ? "Stop recording" : isProcessing ? "Processing…" : "Speak to Kelli"}
              className={[styles.iconButton, styles.primaryButton, (isListening || isProcessing) ? styles.buttonActive : ""].join(" ")}
              disabled={isProcessing}
              onClick={onMicClick}
              type="button"
            >
              {analyserNode ? <AudioBars analyserNode={analyserNode} /> : <MicIcon active={isListening} />}
            </button>
            <button aria-label="Text mode" className={[styles.iconButton, styles.sideButton, styles.rightButton].join(" ")} type="button">
              <MessageCircleMoreIcon />
            </button>
          </div>
        </div>

        <div className={[styles.sheetBackdrop, sheetOpen ? styles.sheetBackdropVisible : ""].join(" ")} onClick={onSheetClose} />

        <div ref={sheetRef} className={[styles.sheet, sheetOpen ? styles.sheetOpen : ""].join(" ")}>
          <div className={styles.sheetDragArea} onPointerCancel={handlePointerCancel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            <div className={styles.sheetHandle} />
          </div>
          <div className={styles.sheetScroll}>{sheetScrollContent}</div>
          <div className={styles.sheetFooter}>{sheetFooter}</div>
        </div>
      </section>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function DemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlayReady, setOverlayReady] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  // MongoDB state
  const [tripId, setTripId] = useState<string | null>(null);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [frameCompleted, setFrameCompleted] = useState<Record<number, boolean>>({});

  // Conversation state
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [knownFields, setKnownFields] = useState<Record<string, string>>({});
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // MediaRecorder + silence-detection refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Selection state (lifted from sub-components)
  const [selectedFlight, setSelectedFlight] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  const [liveFlights, setLiveFlights] = useState<DisplayFlight[] | null>(null);
  const [liveFlightResults, setLiveFlightResults] = useState<Flight[] | null>(null);
  const [isFlightSearchLoading, setIsFlightSearchLoading] = useState(false);
  const [flightSearchMessage, setFlightSearchMessage] = useState<string | null>(null);
  const [isProgressHydrated, setIsProgressHydrated] = useState(false);

  const { say, stopSpeaking } = useMascot();
  const frame = FRAMES[currentIndex];
  const sheetOpen = overlayReady && !overlayDismissed;
  const showEllipsis = overlayReady && overlayDismissed;

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || typeof window === "undefined") return;

      try {
        const raw = window.localStorage.getItem(DEMO_PROGRESS_STORAGE_KEY);
        if (!raw) return;

        const snapshot = JSON.parse(raw) as Partial<DemoProgressSnapshot>;
        if (snapshot.version !== 1) {
          window.localStorage.removeItem(DEMO_PROGRESS_STORAGE_KEY);
          return;
        }

        if (typeof snapshot.currentIndex === "number") {
          setCurrentIndex(Math.max(0, Math.min(FRAMES.length - 1, snapshot.currentIndex)));
        }
        if (typeof snapshot.overlayReady === "boolean") setOverlayReady(snapshot.overlayReady);
        if (typeof snapshot.overlayDismissed === "boolean") setOverlayDismissed(snapshot.overlayDismissed);
        if (typeof snapshot.tripId === "string" || snapshot.tripId === null) setTripId(snapshot.tripId);
        if (snapshot.tripData) setTripData(snapshot.tripData);
        if (snapshot.frameCompleted) setFrameCompleted(snapshot.frameCompleted);
        if (Array.isArray(snapshot.conversationMessages)) setConversationMessages(snapshot.conversationMessages);
        if (snapshot.knownFields) setKnownFields(snapshot.knownFields);
        if (typeof snapshot.selectedFlight === "number") setSelectedFlight(snapshot.selectedFlight);
        if (typeof snapshot.selectedBundle === "number" || snapshot.selectedBundle === null) {
          setSelectedBundle(snapshot.selectedBundle);
        }
      } catch {
        window.localStorage.removeItem(DEMO_PROGRESS_STORAGE_KEY);
      } finally {
        if (!cancelled) setIsProgressHydrated(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isProgressHydrated || typeof window === "undefined") return;

    const snapshot: DemoProgressSnapshot = {
      version: 1,
      currentIndex,
      overlayReady,
      overlayDismissed,
      tripId,
      tripData,
      frameCompleted,
      conversationMessages,
      knownFields,
      selectedFlight,
      selectedBundle,
    };

    window.localStorage.setItem(DEMO_PROGRESS_STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    conversationMessages,
    currentIndex,
    frameCompleted,
    isProgressHydrated,
    knownFields,
    overlayDismissed,
    overlayReady,
    selectedBundle,
    selectedFlight,
    tripData,
    tripId,
  ]);

  // Speak the frame greeting, then open the sheet once Kelli finishes talking.
  // Frame 0 is special: sheet only opens after Gemini parses the user's speech.
  useEffect(() => {
    if (!isProgressHydrated) return;
    let cancelled = false;

    async function run() {
      await say(frame.message, frame.tone);
      if (!cancelled && currentIndex !== 0) setOverlayReady(true);
    }

    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isProgressHydrated]);

  // Fetch real flights when entering frame 1 (flight picker)
  useEffect(() => {
    if (!isProgressHydrated) return;
    if (currentIndex !== 1) return;
    const trip = tripData ?? DEMO_DEFAULTS;
    const homeAirport = "ORD";
    const destAirport = CITY_TO_AIRPORT[trip.city.toLowerCase()] ?? "MXP";
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setIsFlightSearchLoading(true);
      setFlightSearchMessage(null);
      setLiveFlights(null);
      setLiveFlightResults(null);
    });

    fetch("/api/flights/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeAirport,
        destination: destAirport,
        targetDeparture: trip.departure,
        targetReturn: trip.returnDate,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Flight search failed");
        return r.json();
      })
      .then((flights: unknown) => {
        if (cancelled) return;
        if (!Array.isArray(flights) || flights.length === 0) {
          setFlightSearchMessage("Fair Grid returned no live flights for this search. The API request succeeded, but it came back empty.");
          return;
        }
        setSelectedFlight(0);
        setLiveFlightResults((flights as Flight[]).slice(0, 3));
        const mapped: DisplayFlight[] = (flights as import("@/types/flight").Flight[]).slice(0, 3).map((f, i) => ({
          id: f.id,
          flightNumber: f.outbound.flightNumber,
          carrier: f.outbound.carrier,
          route: `${f.outbound.origin} → ${f.outbound.destination}`,
          priceUsd: f.priceUsd,
          dep: fmtTime(f.outbound.departureTime),
          arr: fmtTime(f.outbound.arrivalTime),
          dur: fmtDur(f.outbound.durationMinutes),
          stops: f.distanceFromHomeAirportMiles > 0
            ? `${Math.round(f.distanceFromHomeAirportMiles)} mi from ${homeAirport}`
            : "Fair Grid match",
          tag: f.saturdayNightSavingsUsd > 0 ? `Save $${f.saturdayNightSavingsUsd}` : i === 0 ? "Best pick" : undefined,
        }));
        setLiveFlights(mapped);
      })
      .catch(() => {
        if (cancelled) return;
        setFlightSearchMessage("Live flight search failed, so no results are being shown. Check the Fair Grid provider response instead of relying on demo data.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsFlightSearchLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isProgressHydrated]);

  // ── Voice input (Gemini STT) ─────────────────────────────────

  function stopListening() {
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
  }

  function startListening() {
    if (isListening || isProcessing) return;

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      setAnalyserNode(analyser);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (silenceTimerRef.current) {
          clearInterval(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setAnalyserNode(null);
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 500) {
          void say("I didn't quite catch that. Could you try again?", "empathetic");
          return;
        }
        void transcribeAndProcess(blob, (recorder.mimeType || "audio/webm").split(";")[0]);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);

      // Auto-stop after 1.8 s of silence
      const SILENCE_THRESHOLD = 10;
      const SILENCE_MS = 1800;
      let silenceStart: number | null = null;

      silenceTimerRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state !== "recording") {
          clearInterval(silenceTimerRef.current!);
          silenceTimerRef.current = null;
          return;
        }
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        if (avg < SILENCE_THRESHOLD) {
          silenceStart = silenceStart ?? Date.now();
          if (Date.now() - silenceStart >= SILENCE_MS) stopListening();
        } else {
          silenceStart = null;
        }
      }, 100);
    }).catch(() => {
      alert("Microphone access is required. Please allow mic permissions in your browser.");
    });
  }

  async function transcribeAndProcess(blob: Blob, mimeType: string) {
    setIsProcessing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const sttRes = await fetch("/api/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType }),
      });

      if (!sttRes.ok) throw new Error("STT failed");
      const { text } = (await sttRes.json()) as { text: string };

      if (text?.trim()) {
        await handleUserSpeech(text.trim());
      } else {
        void say("I didn't quite catch that. Could you try again?", "empathetic");
      }
    } catch {
      void say("I'm having trouble with voice right now. Please try again.", "empathetic");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleMicClick() {
    if (isListening) stopListening();
    else startListening();
  }

  async function handleUserSpeech(userText: string) {
    const msgs: ConversationMessage[] = [
      ...conversationMessages,
      { role: "user", content: userText },
    ];
    setConversationMessages(msgs);

    try {
      const res = await fetch("/api/demo/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, frameIndex: currentIndex, knownFields }),
      });
      const data = (await res.json()) as {
        mascotMessage: string;
        tone: Tone;
        extractedData: (Record<string, string> & { return: string }) | null;
        isComplete: boolean;
        knownFields?: Record<string, string>;
      };

      if (data.knownFields) setKnownFields(data.knownFields);

      if (data.extractedData && currentIndex === 0) {
        setTripData({
          city: data.extractedData.city,
          country: data.extractedData.country,
          departure: data.extractedData.departure,
          returnDate: data.extractedData.return,
          passportExpiry: data.extractedData.passportExpiry,
          purpose: data.extractedData.purpose ?? "",
        });
      }

      setConversationMessages([...msgs, { role: "assistant", content: data.mascotMessage }]);
      await say(data.mascotMessage, data.tone);
      if (data.extractedData && currentIndex === 0) setOverlayReady(true);
    } catch {
      await say("I'm having trouble connecting right now. Please try again.", "empathetic");
    }
  }

  // ── Frame actions ────────────────────────────────────────────

  async function handlePrimary() {
    if (isProcessing || frameCompleted[currentIndex]) return;

    setIsProcessing(true);
    try {
      if (currentIndex === 0) {
        const data = tripData ?? DEMO_DEFAULTS;
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: { city: data.city, country: data.country, officeLat: 45.4654, officeLng: 9.1866 },
            dates: { departure: data.departure, return: data.returnDate },
          }),
        });
        if (res.ok) {
          const trip = (await res.json()) as { _id: string };
          setTripId(trip._id);
        }
      } else if (tripId) {
        await executeFrameAction(currentIndex, tripId, {
          flight: selectedFlight,
          bundle: selectedBundle,
          liveFlights: liveFlightResults,
        });
      }

      setFrameCompleted((prev) => ({ ...prev, [currentIndex]: true }));
      setOverlayDismissed(true); // close sheet on success
    } catch (err) {
      console.error("Frame action error:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSecondary() { setOverlayDismissed(true); }
  function handleEllipsisOpen() { setOverlayDismissed(false); }
  function handleSheetClose() { setOverlayDismissed(true); }

  async function handleBack() {
    if (isProcessing || currentIndex === 0) return;

    if (frameCompleted[currentIndex] && tripId) {
      setIsProcessing(true);
      try {
        await revertFrameAction(currentIndex, tripId);
        setFrameCompleted((prev) => {
          const next = { ...prev };
          delete next[currentIndex];
          return next;
        });
      } catch (err) {
        console.error("Revert error:", err);
      } finally {
        setIsProcessing(false);
      }
    }

    stopSpeaking();
    setOverlayReady(false);
    setOverlayDismissed(false);
    setCurrentIndex((v) => Math.max(0, v - 1));
  }

  function handleNext() {
    if (!frameCompleted[currentIndex] || isProcessing) return;
    stopSpeaking();
    setOverlayReady(false);
    setOverlayDismissed(false);
    setCurrentIndex((v) => Math.min(FRAMES.length - 1, v + 1));
  }

  if (!isProgressHydrated) {
    return (
      <main className={styles.page}>
        <div className={styles.phone}>
          <section className={styles.shell} />
        </div>
      </main>
    );
  }

  // ── Render helpers ───────────────────────────────────────────

  function renderFrameVisual() {
    switch (currentIndex) {
      case 0: return <TripCard tripData={tripData} />;
      case 1:
        if (isFlightSearchLoading) {
          return (
            <FlightSearchState
              body="Running Fair Grid across live dates and nearby airports."
              icon="⏳"
              title="Searching Live Flights"
            />
          );
        }
        if (flightSearchMessage) {
          return (
            <FlightSearchState
              body={flightSearchMessage}
              icon="⚠️"
              title="Live Flight Search Required"
            />
          );
        }
        if (!liveFlights?.length) {
          return (
            <FlightSearchState
              body="No live flight options are loaded yet."
              icon="🛫"
              title="Waiting for Fair Grid"
            />
          );
        }
        return <FlightPicker flights={liveFlights} onChange={setSelectedFlight} value={selectedFlight} />;
      case 4: return <BundlePicker value={selectedBundle} onChange={setSelectedBundle} />;
      default: { const V = frame.Visual; return <V />; }
    }
  }

  const canConfirmCurrentFrame = true;

  const scrollContent = (
    <div className={styles.sheetContent}>
      <h2 className={styles.sheetTitle}>{frame.sheetTitle}</h2>
      {renderFrameVisual()}
    </div>
  );

  const footerContent = (
    <div className={styles.sheetActions}>
      <button
        className={[styles.actionButton, styles.primaryAction, isProcessing ? styles.buttonLoading : ""].join(" ")}
        disabled={isProcessing || frameCompleted[currentIndex] || !canConfirmCurrentFrame}
        onClick={() => void handlePrimary()}
        type="button"
      >
        {isProcessing ? "Saving…" : frameCompleted[currentIndex] ? "Done" : frame.options[0]}
      </button>
      <button className={[styles.actionButton, styles.secondaryAction].join(" ")} onClick={handleSecondary} type="button">
        {frame.options[1]}
      </button>
    </div>
  );

  return (
    <main className={styles.page}>
      <PhoneShell
        analyserNode={analyserNode}
        isListening={isListening}
        isProcessing={isProcessing}
        onEllipsisOpen={handleEllipsisOpen}
        onMicClick={handleMicClick}
        onSheetClose={handleSheetClose}
        sheetFooter={footerContent}
        sheetScrollContent={scrollContent}
        sheetOpen={sheetOpen}
        showEllipsis={showEllipsis}
      />
      <div className={styles.nav}>
        <div className={styles.navRow}>
          <button
            className={[styles.navButton, styles.navButtonSecondary].join(" ")}
            disabled={currentIndex === 0 || isProcessing}
            onClick={() => void handleBack()}
            type="button"
          >
            Back
          </button>
          <button
            className={[styles.navButton, styles.navButtonPrimary].join(" ")}
            disabled={currentIndex === FRAMES.length - 1 || !frameCompleted[currentIndex] || isProcessing}
            onClick={handleNext}
            type="button"
          >
            Next
          </button>
        </div>
        <span className={styles.counter}>
          {currentIndex + 1} <span className={styles.counterOf}>of</span> {FRAMES.length}
          {tripId && <span className={styles.counterOf}> · Trip saved</span>}
        </span>
      </div>
    </main>
  );
}
