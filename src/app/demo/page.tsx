"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowBigLeft, Ellipsis, Pencil, Send as SendIcon } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { useMascot } from "@/hooks/useMascot";
import type { Flight, FlightGroup } from "@/types/flight";
import styles from "./page.module.css";

// ── Types ──────────────────────────────────────────────────────

type Tone = "neutral" | "excited" | "empathetic" | "urgent";

type TripData = {
  city: string;
  country: string;
  originCity: string;
  departure: string;
  returnDate: string;
  passportExpiry: string;
  purpose: string;
};

type ConversationMessage = { role: "user" | "assistant"; content: string; frameIndex?: number };

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
  selectedReturn: number;
  selectedBundle: number | null;
};

type CrisisPayload = {
  crisis: boolean;
  alternative: { flightNumber: string; carrier: string; departureTime: string; arrivalTime: string; priceUsd: number; origin: string; destination: string } | null;
  isOverBudget: boolean;
  overageUsd: number;
  mascotMessage: string;
  exceptionDraft: { subject: string; body: string } | null;
};

// ── Demo data (hardcoded for unimplemented integrations) ───────

const DEMO_DEFAULTS: TripData = {
  city: "Milan",
  country: "IT",
  originCity: "Chicago",
  departure: "2026-06-14",
  returnDate: "2026-06-21",
  passportExpiry: "2028-12-01",
  purpose: "Client on-site meeting",
};

type DisplayReturn = {
  id: string; flightNumber: string; returnDate: string;
  dep: string; arr: string; dur: string;
  priceUsd: number; totalPriceUsd: number; returnVia?: string;
};

type DisplayFlightGroup = {
  id: string; flightNumber: string; carrier: string; route: string;
  depDate: string; dep: string; arr: string; dur: string;
  tag?: string; returns: DisplayReturn[];
};

const DEMO_FLIGHT_GROUPS: DisplayFlightGroup[] = [
  {
    id: "lh8904", flightNumber: "LH 8904", carrier: "Lufthansa", route: "ORD → MXP",
    depDate: "Sep 14", dep: "8:45 AM", arr: "11:20 AM+1", dur: "9h 35m",
    returns: [
      { id: "lh8904-r1", flightNumber: "LH 8905", returnDate: "Sep 19", dep: "1:20 PM", arr: "4:55 PM", dur: "9h 35m", priceUsd: 380, totalPriceUsd: 1067 },
      { id: "lh8904-r2", flightNumber: "LX 0220", returnDate: "Sep 19", dep: "9:40 AM", arr: "1:15 PM+1", dur: "11h 35m", priceUsd: 310, totalPriceUsd: 997, returnVia: "via ZRH" },
      { id: "lh8904-r3", flightNumber: "AF 1121", returnDate: "Sep 20", dep: "4:15 PM", arr: "7:50 PM", dur: "9h 35m", priceUsd: 420, totalPriceUsd: 1107 },
    ],
  },
  {
    id: "lx0117", flightNumber: "LX 0117", carrier: "Swiss", route: "ORD → ZRH → MXP",
    depDate: "Sep 14", dep: "6:15 AM", arr: "2:50 PM+1", dur: "10h 35m",
    returns: [
      { id: "lx0117-r1", flightNumber: "LX 0118", returnDate: "Sep 19", dep: "11:50 AM", arr: "4:10 PM+1", dur: "10h 20m", priceUsd: 250, totalPriceUsd: 793, returnVia: "via ZRH" },
      { id: "lx0117-r2", flightNumber: "LH 8905", returnDate: "Sep 19", dep: "1:20 PM", arr: "4:55 PM", dur: "9h 35m", priceUsd: 380, totalPriceUsd: 923 },
    ],
  },
  {
    id: "af0264", flightNumber: "AF 0264", carrier: "Air France", route: "ORD → BGY",
    depDate: "Sep 14", dep: "10:30 AM", arr: "12:15 PM+1", dur: "8h 45m",
    returns: [
      { id: "af0264-r1", flightNumber: "ITA 502", returnDate: "Sep 19", dep: "6:30 AM", arr: "9:15 AM", dur: "9h 45m", priceUsd: 195, totalPriceUsd: 607 },
      { id: "af0264-r2", flightNumber: "AF 0265", returnDate: "Sep 19", dep: "2:15 PM", arr: "5:00 PM", dur: "9h 45m", priceUsd: 280, totalPriceUsd: 692 },
      { id: "af0264-r3", flightNumber: "AF 0267", returnDate: "Sep 20", dep: "11:00 AM", arr: "1:45 PM+1", dur: "10h 45m", priceUsd: 320, totalPriceUsd: 732, returnVia: "via CDG" },
    ],
  },
];

const CITY_TO_AIRPORT: Record<string, string> = {
  // North America — origin cities
  "kansas city": "MCI", "st. louis": "STL", "saint louis": "STL",
  chicago: "ORD", milwaukee: "MKE",
  "new york": "JFK", "new york city": "JFK", nyc: "JFK",
  boston: "BOS",
  washington: "DCA", "washington dc": "IAD", "washington d.c.": "IAD",
  atlanta: "ATL",
  miami: "MIA",
  dallas: "DFW", "fort worth": "DFW",
  houston: "IAH",
  denver: "DEN",
  phoenix: "PHX",
  "los angeles": "LAX",
  "san francisco": "SFO",
  seattle: "SEA",
  minneapolis: "MSP",
  detroit: "DTW",
  philadelphia: "PHL",
  charlotte: "CLT",
  toronto: "YYZ",
  // Europe — destination cities
  milan: "MXP", rome: "FCO", paris: "CDG", london: "LHR",
  amsterdam: "AMS", frankfurt: "FRA", madrid: "MAD",
  barcelona: "BCN", lisbon: "LIS", zurich: "ZRH",
  // Asia / Pacific / Middle East — destination cities
  tokyo: "NRT", dubai: "DXB", singapore: "SIN", sydney: "SYD",
};

function fmtTime(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function fmtDate(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

const EMBASSY_BY_COUNTRY: Record<string, { name: string; address: string; hours: string }> = {
  IT: { name: "US Embassy Rome", address: "Via Vittorio Veneto 121", hours: "Mon–Fri · 8:30 AM – 12:30 PM" },
  FR: { name: "US Embassy Paris", address: "2 Avenue Gabriel", hours: "Mon–Fri · 8:30 AM – 12:30 PM" },
  DE: { name: "US Embassy Berlin", address: "Pariser Platz 2", hours: "Mon–Fri · 8:00 AM – 4:30 PM" },
  GB: { name: "US Embassy London", address: "33 Nine Elms Ln, London", hours: "Mon–Fri · 8:30 AM – 5:00 PM" },
  ES: { name: "US Embassy Madrid", address: "Calle de Serrano 75", hours: "Mon–Fri · 8:30 AM – 12:30 PM" },
  NL: { name: "US Embassy The Hague", address: "John Adams Park 1", hours: "Mon–Fri · 8:00 AM – 5:00 PM" },
  JP: { name: "US Embassy Tokyo", address: "1-10-5 Akasaka, Minato", hours: "Mon–Fri · 8:30 AM – 5:30 PM" },
  AE: { name: "US Embassy Abu Dhabi", address: "Embassies District, Plot 38", hours: "Mon–Fri · 8:00 AM – 4:30 PM" },
  SG: { name: "US Embassy Singapore", address: "27 Napier Rd", hours: "Mon–Fri · 7:30 AM – 4:30 PM" },
  AU: { name: "US Embassy Canberra", address: "Moonah Pl, Yarralumla", hours: "Mon–Fri · 8:30 AM – 5:00 PM" },
};

const VISA_BY_COUNTRY: Record<string, { required: boolean; type?: string; note: string }> = {
  IT: { required: false, note: "US citizens: visa-free (Schengen, 90 days in 180)" },
  FR: { required: false, note: "US citizens: visa-free (Schengen, 90 days in 180)" },
  DE: { required: false, note: "US citizens: visa-free (Schengen, 90 days in 180)" },
  GB: { required: false, note: "US citizens: visa-free up to 6 months" },
  ES: { required: false, note: "US citizens: visa-free (Schengen, 90 days in 180)" },
  NL: { required: false, note: "US citizens: visa-free (Schengen, 90 days in 180)" },
  JP: { required: false, note: "US citizens: visa-free up to 90 days" },
  AE: { required: false, note: "US citizens: visa-on-arrival, 90 days" },
  SG: { required: false, note: "US citizens: visa-free up to 90 days" },
  AU: { required: true, type: "ETA", note: "Electronic Travel Authority required ($20 AUD online)" },
};

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
  sel: { flight: number; selectedReturn?: number; bundle: number | null; liveFlightGroups?: FlightGroup[] | null }
) {
  const liveGroup = sel.liveFlightGroups?.[sel.flight];
  const flight = liveGroup?.outbound ?? DEMO_FLIGHT_GROUPS[sel.flight] ?? DEMO_FLIGHT_GROUPS[0];
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
      await patchTrip(tripId, { flights: [REBOOKED_FLIGHT] });
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

function FlightPicker({
  value, onOutboundChange, returnValue, onReturnChange, groups,
}: {
  value?: number;
  onOutboundChange?: (i: number) => void;
  returnValue?: number;
  onReturnChange?: (i: number) => void;
  groups?: DisplayFlightGroup[] | null;
}) {
  const [localSel, setLocalSel] = useState(0);
  const [localRetSel, setLocalRetSel] = useState(0);
  const sel = value ?? localSel;
  const retSel = returnValue ?? localRetSel;
  const list = groups?.length ? groups : DEMO_FLIGHT_GROUPS;

  function selectOutbound(i: number) {
    (onOutboundChange ?? setLocalSel)(i);
    (onReturnChange ?? setLocalRetSel)(0);
  }
  function selectReturn(i: number) {
    (onReturnChange ?? setLocalRetSel)(i);
  }

  const tags: Record<number, string> = {};
  if (list.length > 0) {
    tags[0] = list[0].tag ?? "Best pick";
    const cheapestIdx = list.reduce((ci, g, i) => {
      const gPrice = g.returns[0]?.totalPriceUsd ?? Infinity;
      const cPrice = list[ci].returns[0]?.totalPriceUsd ?? Infinity;
      return gPrice < cPrice ? i : ci;
    }, 0);
    if (cheapestIdx !== 0) tags[cheapestIdx] = list[cheapestIdx].tag ?? "Cheapest";
  }

  return (
    <div className={styles.cards}>
      {list.map((g, i) => {
        const cheapestTotal = g.returns[0]?.totalPriceUsd;
        const isSelected = sel === i;
        return (
          <div className={styles.flightGroupWrap} key={g.id}>
            <button
              className={[styles.card, isSelected ? styles.cardSelected : ""].join(" ")}
              onClick={() => selectOutbound(i)}
              type="button"
            >
              <div className={styles.cardRow}>
                <span className={styles.cardLabel}>{g.flightNumber}</span>
                {tags[i] && <span className={styles.cardTag}>{tags[i]}</span>}
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardMain}>{g.route}</span>
                {cheapestTotal !== undefined && <span className={styles.cardPrice}>from ${cheapestTotal}</span>}
              </div>
              <span className={styles.cardMeta}>{g.depDate} · {g.dep} → {g.arr} · {g.dur}</span>
            </button>
            {isSelected && g.returns.length > 0 && (
              <div className={styles.returnOptions}>
                <span className={styles.returnOptionsLabel}>Return flights</span>
                {g.returns.map((r, ri) => (
                  <button
                    className={[styles.returnCard, retSel === ri ? styles.returnCardSelected : ""].join(" ")}
                    key={r.id}
                    onClick={() => selectReturn(ri)}
                    type="button"
                  >
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>{r.flightNumber}{r.returnVia ? ` · ${r.returnVia}` : ""}</span>
                      <span className={[styles.cardPrice, styles.returnCardPrice].join(" ")}>${r.totalPriceUsd}</span>
                    </div>
                    <span className={styles.cardMeta}>{r.returnDate} · {r.dep} → {r.arr} · {r.dur}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
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

function ComplianceReport({ flightNumber, flightPriceUsd, flightCapUsd, hotelName, hotelPriceUsd, hotelCapUsd, nights, depStr, retStr, country }: {
  flightNumber?: string; flightPriceUsd?: number; flightCapUsd?: number;
  hotelName?: string; hotelPriceUsd?: number; hotelCapUsd?: number;
  nights?: number; depStr?: string; retStr?: string; country?: string;
}) {
  const fn = flightNumber ?? "LH 8904";
  const fp = flightPriceUsd ?? 687;
  const fc = flightCapUsd ?? 800;
  const hn = hotelName ?? "Marriott Scala";
  const hp = hotelPriceUsd ?? 247;
  const hc = hotelCapUsd ?? 200;
  const n = nights ?? 5;
  const d = depStr ?? "Sep 14";
  const r = retStr ?? "Sep 19";
  const cty = country ?? "IT";
  const flightOk = fp <= fc;
  const hotelOk = hp <= hc;
  const hotelOverage = Math.round(hp - hc);
  const visa = VISA_BY_COUNTRY[cty] ?? { required: false, note: "Check entry requirements for this destination" };
  return (
    <div className={styles.complianceList}>
      {visa.required ? (
        <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
          <span className={styles.complianceIcon}>⚠️</span>
          <div>
            <div className={styles.complianceTitle}>{visa.type ?? "Visa"} Required</div>
            <div className={styles.complianceBody}>{visa.note}</div>
          </div>
        </div>
      ) : (
        <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
          <span className={styles.complianceIcon}>✓</span>
          <div>
            <div className={styles.complianceTitle}>No visa required</div>
            <div className={styles.complianceBody}>{visa.note}</div>
          </div>
        </div>
      )}
      {hotelOk ? (
        <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
          <span className={styles.complianceIcon}>✓</span>
          <div>
            <div className={styles.complianceTitle}>Hotel within cap</div>
            <div className={styles.complianceBody}>{hn} at ${hp}/night · cap is ${hc}</div>
          </div>
        </div>
      ) : (
        <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
          <span className={styles.complianceIcon}>⚠️</span>
          <div>
            <div className={styles.complianceTitle}>Hotel Exception Needed</div>
            <div className={styles.complianceBody}>{hn} at ${hp}/night is ${hotelOverage} over the ${hc} cap</div>
          </div>
        </div>
      )}
      <div className={[styles.complianceItem, flightOk ? styles.complianceOk : styles.complianceWarn].join(" ")}>
        <span className={styles.complianceIcon}>{flightOk ? "✓" : "⚠️"}</span>
        <div>
          <div className={styles.complianceTitle}>{flightOk ? "Flight within budget" : "Flight over budget"}</div>
          <div className={styles.complianceBody}>{fn} at ${fp} · approved cap is ${fc}</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Travel dates policy-compliant</div>
          <div className={styles.complianceBody}>{d} to {r} · {n}-night stay · within 10-day maximum</div>
        </div>
      </div>
    </div>
  );
}

function ApprovalEmail({ city, country, depStr, retStr, flightNumber, flightRoute, flightPriceUsd, hotelName, hotelPriceUsd, hotelCapUsd, nights, totalCostUsd, purpose }: {
  city?: string; country?: string; depStr?: string; retStr?: string; flightNumber?: string; flightRoute?: string;
  flightPriceUsd?: number; hotelName?: string; hotelPriceUsd?: number; hotelCapUsd?: number;
  nights?: number; totalCostUsd?: number; purpose?: string;
}) {
  const c = city ?? "Milan"; const co = country ?? "Italy"; const d = depStr ?? "Sep 14"; const r = retStr ?? "Sep 19";
  const fn = flightNumber ?? "LH 8904"; const fr = flightRoute ?? "ORD → MXP"; const fp = flightPriceUsd ?? 687;
  const hn = hotelName ?? "Marriott Scala"; const hp = hotelPriceUsd ?? 247; const hc = hotelCapUsd ?? 200;
  const n = nights ?? 5; const tc = totalCostUsd ?? 2010; const pu = purpose ?? "on-site client meeting";
  const hotelTotal = hp * n;
  const hotelOverage = Math.round(hp - hc);
  const hotelOverStr = hotelOverage > 0 ? ` — $${hotelOverage} over the $${hc} cap, closest preferred vendor to client office` : " — fully compliant";
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Travel Approval — {c}, {d}–{r}</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p>I&#39;m requesting approval for a business trip to <strong>{c}, {co}, {d}–{r}</strong> for {pu}.</p>
        <p><strong>Flight:</strong> {fn}, {fr} · ${fp} (nonstop)<br />
        <strong>Hotel:</strong> {hn} · ${hp}/night × {n} = ${hotelTotal}{hotelOverStr}.</p>
        <p>Total estimated: ${tc.toLocaleString()}. Please let me know if you have any questions.</p>
        <p>Thanks,<br />Kelli</p>
      </div>
    </div>
  );
}

function HotelComparison({ rejectedName, rejectedPrice, rejectedDist, rejectedPreferred, capUsd, altName, altPrice, altDist, altPreferred, nights }: {
  rejectedName?: string; rejectedPrice?: number; rejectedDist?: string; rejectedPreferred?: boolean;
  capUsd?: number; altName?: string; altPrice?: number; altDist?: string; altPreferred?: boolean; nights?: number;
}) {
  const rn = rejectedName ?? "Marriott Scala"; const rp = rejectedPrice ?? 247; const rd = rejectedDist ?? "0.4 km";
  const rpr = rejectedPreferred ?? true; const cap = capUsd ?? 200;
  const an = altName ?? "AC Hotel Milan"; const ap = altPrice ?? 189; const ad = altDist ?? "1.2 km";
  const apr = altPreferred ?? true; const n = nights ?? 5;
  const overagePerNight = Math.round(rp - cap);
  const savings = (rp - ap) * n;
  return (
    <div className={styles.compareGrid}>
      <div className={[styles.compareCard, styles.compareRejected].join(" ")}>
        <div className={styles.compareBadge}>Rejected ✗</div>
        <div className={styles.compareName}>{rn}</div>
        <div className={styles.comparePrice}>${rp} / night</div>
        {rpr && <div className={styles.compareMeta}>⭐ Preferred vendor</div>}
        <div className={styles.compareMeta}>{rd} from office</div>
        <div className={styles.compareReason}>${overagePerNight} over the ${cap} cap</div>
      </div>
      <div className={[styles.compareCard, styles.compareApproved].join(" ")}>
        <div className={styles.compareBadge}>Alternative ✓</div>
        <div className={styles.compareName}>{an}</div>
        <div className={styles.comparePrice}>${ap} / night</div>
        {apr && <div className={styles.compareMeta}>⭐ Preferred vendor</div>}
        <div className={styles.compareMeta}>{ad} from office</div>
        <div className={styles.compareReason}>Saves ${savings} total · fully compliant</div>
      </div>
    </div>
  );
}

function PrepChecklist({ hotelName, hotelAddress, flightNumber, depStr, country, passportExpiry, departure }: {
  hotelName?: string; hotelAddress?: string; flightNumber?: string; depStr?: string;
  country?: string; passportExpiry?: string; departure?: string;
}) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const hn = hotelName ?? "Marriott Scala";
  const ha = hotelAddress ?? "Via della Spiga 31, Milan";
  const fn = flightNumber ?? "LH 8904";
  const d = depStr ?? "Sep 14";
  const cty = country ?? "IT";
  const visa = VISA_BY_COUNTRY[cty];
  const passExpiringSoon = passportExpiry && departure && isPassportExpiringSoon(passportExpiry, departure);
  const items = [
    ...(visa?.required ? [{ text: `Apply for ${visa.type ?? "Visa"} — ${visa.note}`, urgent: true }] : []),
    ...(passExpiringSoon ? [{ text: `Passport expires soon — check renewal requirements`, urgent: true }] : []),
    { text: `Pack for the trip — check local weather forecast for ${cty}` },
    { text: `${hn} · ${ha} · Check-in ${d} at 3:00 PM` },
    { text: `Flight ${fn} departs ${d} — confirm seat and gate the morning of travel` },
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

function LiveDashboard({ flightNumber, dep, destCity, destAirport, hotelName }: {
  flightNumber?: string; dep?: string; destCity?: string; destAirport?: string; hotelName?: string;
}) {
  const fn = flightNumber ?? "LH 8904"; const d = dep ?? "8:45 AM"; const dc = destCity ?? "Milan";
  const da = destAirport ?? "MXP"; const hn = hotelName ?? "Marriott Scala";
  const boardTime = (() => {
    const [h, rest] = d.split(":");
    const [m, ampm] = (rest ?? "").split(" ");
    const hour = parseInt(h ?? "8"); const min = parseInt(m ?? "45");
    const boardMin = min >= 30 ? min - 30 : 60 + min - 30;
    const boardHour = min >= 30 ? hour : hour - 1;
    return `${boardHour}:${String(boardMin).padStart(2, "0")} ${ampm ?? "AM"}`;
  })();
  return (
    <div className={styles.dashboard}>
      {[
        { icon: "✈️", title: `${fn} · Gate B22`, sub: `Boards ${boardTime} · Departs ${d}`, badge: "On time" },
        { icon: "🌤️", title: `${dc} · 24 °C`, sub: "Partly cloudy · Low 18 °C tonight", badge: "" },
        { icon: "🏨", title: `${hn} · Room 412`, sub: "Check-in ready from 3:00 PM", badge: "Ready" },
        { icon: "🚗", title: `Traffic to ${da} · 32 min`, sub: `Leave by ${boardTime} to make your gate`, badge: "" },
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

function ExceptionEmail({ origFlight, origRoute, origPriceUsd, altFlight, altPriceUsd, destCity }: {
  origFlight?: string; origRoute?: string; origPriceUsd?: number;
  altFlight?: string; altPriceUsd?: number; destCity?: string;
}) {
  const of_ = origFlight ?? "LH 8904"; const or_ = origRoute ?? "ORD → MXP"; const op = origPriceUsd ?? 687;
  const af = altFlight ?? "LH 9012"; const ap = altPriceUsd ?? 1067; const dc = destCity ?? "Milan";
  const overageUsd = Math.round(ap - op);
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Priority</span><span className={[styles.emailVal, styles.emailUrgent].join(" ")}>HIGH - Action required</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Emergency Exception — {dc} Rebooking</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p><strong>{of_} ({or_}) was cancelled due to a disruption.</strong> The only available rebooking is {af} at <strong>${ap.toLocaleString()}</strong>, which is ${overageUsd} over the approved ${op} budget.</p>
        <p>Force majeure — requesting emergency exception. Hotel hold expires in 2 hours.</p>
        <p>Kelli</p>
      </div>
    </div>
  );
}

function ArrivalSupport({ hotelName, hotelAddress, destAirport }: {
  hotelName?: string; hotelAddress?: string; destAirport?: string;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const hn = hotelName ?? "Marriott Scala";
  const ha = hotelAddress ?? "Via della Spiga 31, Milan";
  const da = destAirport ?? "MXP";
  const options = [
    { icon: "🚕", name: "Company taxi", time: "18 min", cost: "$14", preferred: true },
    { icon: "🚇", name: "Public transit", time: "35 min", cost: "$2.50", preferred: false },
    { icon: "🚶", name: "Walk", time: "28 min", cost: "Free", preferred: false },
  ];
  return (
    <div className={styles.arrival}>
      <div className={styles.arrivalDest}>
        <span className={styles.arrivalPin}>📍</span>
        <div>
          <div className={styles.arrivalName}>{hn}</div>
          <div className={styles.arrivalAddr}>{ha} · 2.3 km from {da}</div>
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

function ContactCards({ country }: { country?: string }) {
  const cty = country ?? "IT";
  const embassy = EMBASSY_BY_COUNTRY[cty] ?? { name: "US Embassy", address: "See travel.state.gov for address", hours: "Mon–Fri · 8:00 AM – 5:00 PM" };
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
          <div className={styles.contactName}>{embassy.name}</div>
          <div className={styles.contactDetail}>{embassy.address}</div>
          <div className={styles.contactDetail}>{embassy.hours}</div>
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

// ── Crisis panel (real API) ────────────────────────────────────

// payload = undefined  → still loading (page hasn't finished the crisis fetch)
// payload = null       → fetch failed or no trip id
// payload = CrisisPayload → ready
function DemoCrisisPanel({ tripId, payload }: { tripId: string | null; payload: CrisisPayload | null | undefined }) {
  const [rebooked, setRebooked] = useState(false);
  const [exceptionSent, setExceptionSent] = useState(false);
  const [sendingException, setSendingException] = useState(false);

  function handleSendException() {
    if (!tripId || !payload?.exceptionDraft) return;
    setSendingException(true);
    fetch(`/api/trips/${tripId}/exception`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.exceptionDraft),
    })
      .then(() => setExceptionSent(true))
      .catch(() => {})
      .finally(() => setSendingException(false));
  }

  if (payload === undefined) {
    return <FlightSearchState body="Checking live flight status and finding alternatives…" icon="⏳" title="Detecting Disruption" />;
  }

  if (!payload) {
    return <FlightRebooking />;
  }

  const alt = payload.alternative;

  return (
    <div className={styles.cards}>
      <FlightSearchState body="Exceeds the 45-minute connection window" icon="⚠️" title="90-Minute Delay Detected" />

      {alt ? (
        <div className={styles.card}>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>{alt.carrier} · {alt.flightNumber}</span>
            <span className={styles.cardPrice}>${alt.priceUsd}</span>
          </div>
          <span className={styles.cardMeta}>{alt.origin} → {alt.destination}</span>
          <span className={styles.cardMeta}>Departs: {new Date(alt.departureTime).toLocaleString()}</span>
          {payload.isOverBudget && (
            <span className={styles.cardNote}>Exceeds budget by ${payload.overageUsd} — exception drafted below</span>
          )}
          {!rebooked ? (
            <button
              className={[styles.actionButton, styles.primaryAction].join(" ")}
              onClick={() => setRebooked(true)}
              type="button"
            >
              Confirm Rebooking
            </button>
          ) : (
            <span className={styles.cardTag}>✓ Rebooking confirmed</span>
          )}
        </div>
      ) : (
        <FlightSearchState body="Contact the airline gate desk or app for options" icon="📞" title="No Automated Alternative" />
      )}

      {payload.isOverBudget && payload.exceptionDraft && (
        <div className={styles.emailDraft}>
          <div className={styles.emailField}>
            <span className={styles.emailKey}>Subject</span>
            <span className={styles.emailVal}>{payload.exceptionDraft.subject}</span>
          </div>
          <div className={styles.emailBody}><p>{payload.exceptionDraft.body}</p></div>
          {!exceptionSent ? (
            <button
              className={[styles.actionButton, styles.primaryAction].join(" ")}
              disabled={sendingException}
              onClick={handleSendException}
              type="button"
            >
              {sendingException ? "Sending…" : "Send Exception to Manager"}
            </button>
          ) : (
            <span className={styles.cardTag}>✓ Exception request sent</span>
          )}
        </div>
      )}
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

// ── Roadmap data ───────────────────────────────────────────────

const ROADMAP_PHASES = [
  {
    label: "Planning",
    steps: [
      { index: 0, label: "Share Trip Details", icon: "✈️" },
      { index: 1, label: "Choose a Flight", icon: "🛫" },
      { index: 2, label: "Find a Hotel", icon: "🏨" },
      { index: 3, label: "Compliance Check", icon: "📋" },
      { index: 4, label: "Choose Bundle", icon: "📦" },
    ],
  },
  {
    label: "Approval",
    steps: [
      { index: 5, label: "Submit for Approval", icon: "📬" },
      { index: 6, label: "Handle Rejection", icon: "🔄" },
    ],
  },
  {
    label: "Pre-Trip",
    steps: [
      { index: 7, label: "Travel Checklist", icon: "🗒️" },
    ],
  },
  {
    label: "Live Travel",
    steps: [
      { index: 8, label: "Live Mode Active", icon: "📡" },
      { index: 9, label: "Handle Disruption", icon: "⚡" },
      { index: 10, label: "Emergency Exception", icon: "🚨" },
      { index: 11, label: "Arrival & Transport", icon: "🚕" },
      { index: 12, label: "Capture Receipts", icon: "📸" },
      { index: 13, label: "Human Support", icon: "📞" },
    ],
  },
  {
    label: "Post-Trip",
    steps: [
      { index: 14, label: "Expense Summary", icon: "💰" },
      { index: 15, label: "Data & Privacy", icon: "🔒" },
    ],
  },
];

function RoadmapContent({ currentIndex, frameCompleted }: { currentIndex: number; frameCompleted: Record<number, boolean> }) {
  const allSteps = ROADMAP_PHASES.flatMap((p) => p.steps);
  const total = allSteps.length;

  return (
    <div className={styles.roadmapWrap}>
      <h2 className={styles.sheetTitle}>Your Journey</h2>
      {ROADMAP_PHASES.map((phase) => (
        <div key={phase.label}>
          <div className={styles.roadmapPhaseLabel}>{phase.label}</div>
          {phase.steps.map((step) => {
            const isDone = !!frameCompleted[step.index];
            const isCurrent = currentIndex === step.index;
            const globalIdx = allSteps.findIndex((s) => s.index === step.index);
            const isLast = globalIdx === total - 1;
            return (
              <div key={step.index} className={styles.roadmapStepWrap}>
                <div className={[
                  styles.roadmapStep,
                  isDone ? styles.roadmapStepDone : isCurrent ? styles.roadmapStepCurrent : styles.roadmapStepUpcoming,
                ].join(" ")}>
                  <div className={styles.roadmapStepDot}>
                    {isDone ? "✓" : step.icon}
                  </div>
                  <div className={styles.roadmapStepInfo}>
                    <span className={styles.roadmapStepLabel}>{step.label}</span>
                  </div>
                </div>
                {!isLast && <div className={styles.roadmapConnector} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

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
  chatMode,
  onChatToggle,
  chatMessages,
  chatInput,
  onChatInputChange,
  onChatSend,
  onOpenSheet,
  roadmapOpen,
  onRoadmapOpen,
  onRoadmapClose,
  currentFrameIndex,
  frameCompleted,
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
  chatMode: boolean;
  onChatToggle: () => void;
  chatMessages: ConversationMessage[];
  chatInput: string;
  onChatInputChange: (v: string) => void;
  onChatSend: () => void;
  onOpenSheet: () => void;
  roadmapOpen: boolean;
  onRoadmapOpen: () => void;
  onRoadmapClose: () => void;
  currentFrameIndex: number;
  frameCompleted: Record<number, boolean>;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragging = useRef(false);
  const roadmapSheetRef = useRef<HTMLDivElement>(null);
  const rdragStartY = useRef(0);
  const rdragging = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  function handleRPointerDown(e: React.PointerEvent) {
    rdragging.current = true;
    rdragStartY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleRPointerMove(e: React.PointerEvent) {
    if (!rdragging.current) return;
    const dy = Math.max(0, e.clientY - rdragStartY.current);
    if (roadmapSheetRef.current) {
      roadmapSheetRef.current.style.transition = "none";
      roadmapSheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }

  function handleRPointerUp(e: React.PointerEvent) {
    if (!rdragging.current) return;
    rdragging.current = false;
    const dy = Math.max(0, e.clientY - rdragStartY.current);
    if (roadmapSheetRef.current) {
      roadmapSheetRef.current.style.transition = "";
      roadmapSheetRef.current.style.transform = "";
    }
    if (dy > 100) onRoadmapClose();
  }

  function handleRPointerCancel() {
    rdragging.current = false;
    if (roadmapSheetRef.current) {
      roadmapSheetRef.current.style.transition = "";
      roadmapSheetRef.current.style.transform = "";
    }
  }

  // Last assistant message index for showing card
  const lastAssistantIdx = chatMessages.reduce<number>((acc, m, i) => m.role === "assistant" ? i : acc, -1);

  return (
    <div className={styles.phone}>
      <section className={styles.shell}>
        <div className={styles.content}>
          <div className={styles.topBar}>
            <button aria-label="Open menu" className={styles.menuButton} type="button">
              <MenuIcon />
            </button>
            {chatMode && (
              <button aria-label="Back to voice mode" className={styles.backToVoiceButton} onClick={onChatToggle} type="button">
                <ArrowBigLeft size={26} />
              </button>
            )}
          </div>

          {chatMode ? (
            <div className={styles.chatView}>
              <div className={styles.chatMessages} ref={chatScrollRef}>
                {chatMessages.length === 0 ? (
                  <div className={styles.chatEmpty}>
                    <span>Start a conversation with Kelli</span>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={[styles.chatMsg, msg.role === "user" ? styles.chatMsgUser : styles.chatMsgAssistant].join(" ")}
                    >
                      {msg.role === "assistant" && (
                        <div className={styles.chatAvatarWrap}>
                          <div className={styles.chatAvatar}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img alt="Kelli" src="/kelli-icon.png" style={{ width: 34, height: 34, objectFit: "contain", display: "block", flexShrink: 0 }} />
                          </div>
                        </div>
                      )}
                      <div className={styles.chatBubbleWrap}>
                        <div className={styles.chatBubble}>{msg.content}</div>
                        {msg.role === "assistant" && i === lastAssistantIdx && msg.frameIndex !== undefined && (
                          <button className={styles.chatCard} onClick={onOpenSheet} type="button">
                            <span className={styles.chatCardIcon}>📋</span>
                            <span className={styles.chatCardText}>{FRAMES[msg.frameIndex]?.sheetTitle}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isProcessing && (
                  <div className={[styles.chatMsg, styles.chatMsgAssistant].join(" ")}>
                    <div className={styles.chatAvatarWrap}>
                      <div className={styles.chatAvatar}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="Kelli" src="/kelli-icon.png" style={{ width: 34, height: 34, objectFit: "contain", display: "block", flexShrink: 0 }} />
                      </div>
                    </div>
                    <div className={styles.chatBubble}>
                      <div className={styles.chatTyping}>
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.chatControls}>
                <div className={styles.chatInputWrap}>
                  <input
                    className={styles.chatInput}
                    disabled={isProcessing}
                    onChange={(e) => onChatInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onChatSend();
                      }
                    }}
                    placeholder="Message Kelli…"
                    type="text"
                    value={chatInput}
                  />
                  <button
                    aria-label="Send message"
                    className={[styles.chatIconButton, styles.chatSendButton].join(" ")}
                    disabled={isProcessing || !chatInput.trim()}
                    onClick={onChatSend}
                    type="button"
                  >
                    <SendIcon size={17} />
                  </button>
                </div>
                <button
                  aria-label="Open roadmap"
                  className={styles.chatPencilButton}
                  onClick={onRoadmapOpen}
                  type="button"
                >
                  <Pencil size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.stage}>
              <Mascot
                bubbleAfterTextSlot={showEllipsis ? (
                  <button aria-label="View details" className={styles.ellipsisButton} onClick={onEllipsisOpen} type="button">
                    <Ellipsis size={18} />
                  </button>
                ) : null}
                bubbleClassName={styles.speech}
                bubblePosition="below"
                bubbleSize="lg"
                bubbleVariant="plain"
                className={styles.mascot}
                figureClassName={styles.figure}
              />
            </div>
          )}

          {!chatMode && (
            <div className={styles.controls}>
              <button
                aria-label="View trip roadmap"
                className={[styles.iconButton, styles.sideButton, styles.leftButton].join(" ")}
                onClick={onRoadmapOpen}
                type="button"
              >
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
              <button
                aria-label="Switch to chat mode"
                className={[styles.iconButton, styles.sideButton, styles.rightButton].join(" ")}
                onClick={onChatToggle}
                type="button"
              >
                <MessageCircleMoreIcon />
              </button>
            </div>
          )}
        </div>

        <div className={[styles.sheetBackdrop, sheetOpen ? styles.sheetBackdropVisible : ""].join(" ")} onClick={onSheetClose} />

        <div ref={sheetRef} className={[styles.sheet, sheetOpen ? styles.sheetOpen : ""].join(" ")}>
          <div className={styles.sheetDragArea} onPointerCancel={handlePointerCancel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            <div className={styles.sheetHandle} />
          </div>
          <div className={styles.sheetScroll}>{sheetScrollContent}</div>
          <div className={styles.sheetFooter}>{sheetFooter}</div>
        </div>

        {/* Roadmap overlay */}
        <div className={[styles.sheetBackdrop, styles.roadmapBackdrop, roadmapOpen ? styles.sheetBackdropVisible : ""].join(" ")} onClick={onRoadmapClose} />
        <div ref={roadmapSheetRef} className={[styles.sheet, styles.roadmapSheet, roadmapOpen ? styles.sheetOpen : ""].join(" ")}>
          <div className={styles.sheetDragArea} onPointerCancel={handleRPointerCancel} onPointerDown={handleRPointerDown} onPointerMove={handleRPointerMove} onPointerUp={handleRPointerUp}>
            <div className={styles.sheetHandle} />
          </div>
          <div className={styles.sheetScroll}>
            <RoadmapContent currentIndex={currentFrameIndex} frameCompleted={frameCompleted} />
          </div>
          <div className={styles.sheetFooter}>
            <div className={styles.sheetActions}>
              <button className={[styles.actionButton, styles.secondaryAction].join(" ")} onClick={onRoadmapClose} type="button">
                Close
              </button>
            </div>
          </div>
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Selection state (lifted from sub-components)
  const [selectedFlight, setSelectedFlight] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  const [liveFlights, setLiveFlights] = useState<DisplayFlightGroup[] | null>(null);
  const [liveFlightResults, setLiveFlightResults] = useState<FlightGroup[] | null>(null);
  const [isFlightSearchLoading, setIsFlightSearchLoading] = useState(false);
  const [flightSearchMessage, setFlightSearchMessage] = useState<string | null>(null);
  const [isProgressHydrated, setIsProgressHydrated] = useState(false);

  // Crisis detection state (frame 9) — fetched at page level so the mascot
  // can speak the Gemini-generated message before the visual panel mounts.
  const [crisisPayload, setCrisisPayload] = useState<CrisisPayload | null>(null);
  const [crisisReady, setCrisisReady] = useState(false);

  // Roadmap + chat state
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const greetedFrames = useRef<Set<number>>(new Set());

  const { say, setThinking, stopSpeaking, speech, visibleLength } = useMascot();
  const frame = FRAMES[currentIndex];
  const sheetOpen = overlayReady && !overlayDismissed;
  const showEllipsis = overlayReady && overlayDismissed && speech.length > 0 && visibleLength >= speech.length;

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
        if (typeof snapshot.selectedReturn === "number") setSelectedReturn(snapshot.selectedReturn);
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
      selectedReturn,
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
    selectedReturn,
    tripData,
    tripId,
  ]);

  // Speak the frame greeting, then open the sheet once Kelli finishes talking.
  // Frame 0 is special: sheet only opens after Gemini parses the user's speech.
  // Frame 9 is special: wait for the crisis API before speaking so we can use
  // the Gemini-generated disruption message instead of the hardcoded fallback.
  useEffect(() => {
    if (!isProgressHydrated) return;
    if (currentIndex === 9 && !crisisReady) return;

    const greeting = (currentIndex === 9 && crisisPayload?.mascotMessage)
      ? crisisPayload.mascotMessage
      : frame.message;

    let cancelled = false;

    async function run() {
      // Store greeting in chat history (deduplicated)
      if (!greetedFrames.current.has(currentIndex)) {
        greetedFrames.current.add(currentIndex);
        setConversationMessages((prev) => {
          const alreadyHas = prev.some(
            (m) => m.role === "assistant" && m.frameIndex === currentIndex && m.content === greeting
          );
          if (alreadyHas) return prev;
          return [...prev, { role: "assistant", content: greeting, frameIndex: currentIndex }];
        });
      }
      await say(greeting, frame.tone);
      if (!cancelled && currentIndex !== 0) setOverlayReady(true);
    }

    void run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isProgressHydrated, crisisReady]);

  // Fetch real flights when entering frame 1 (flight picker)
  useEffect(() => {
    if (!isProgressHydrated) return;
    if (currentIndex !== 1) return;
    const trip = tripData ?? DEMO_DEFAULTS;
    const homeAirport = CITY_TO_AIRPORT[trip.originCity?.toLowerCase() ?? ""] ?? "ORD";
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
        setSelectedReturn(0);
        const groups = (flights as FlightGroup[]).slice(0, 3);
        setLiveFlightResults(groups);
        const mapped: DisplayFlightGroup[] = groups.map((g, i) => ({
          id: g.outbound.id,
          flightNumber: g.outbound.outbound.flightNumber,
          carrier: g.outbound.outbound.carrier,
          route: [g.outbound.outbound.origin, ...(g.outbound.outbound.layoverAirports ?? []), g.outbound.outbound.destination].join(' → '),
          depDate: fmtDate(g.outbound.outbound.departureTime),
          dep: fmtTime(g.outbound.outbound.departureTime),
          arr: fmtTime(g.outbound.outbound.arrivalTime),
          dur: fmtDur(g.outbound.outbound.durationMinutes),
          tag: g.outbound.saturdayNightSavingsUsd > 0 ? `Save $${g.outbound.saturdayNightSavingsUsd}` : i === 0 ? "Best pick" : undefined,
          returns: g.returns.slice(0, 4).map(r => ({
            id: r.id,
            flightNumber: r.outbound.flightNumber,
            returnDate: fmtDate(r.outbound.departureTime),
            dep: fmtTime(r.outbound.departureTime),
            arr: fmtTime(r.outbound.arrivalTime),
            dur: fmtDur(r.outbound.durationMinutes),
            priceUsd: r.priceUsd,
            totalPriceUsd: g.outbound.priceUsd + r.priceUsd,
            returnVia: (r.outbound.layoverAirports ?? []).length > 0 ? `via ${(r.outbound.layoverAirports ?? []).join(', ')}` : undefined,
          })),
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

  // Fetch crisis data when entering frame 9 so the mascot speaks Gemini's
  // real disruption message instead of the hardcoded fallback.
  useEffect(() => {
    if (currentIndex !== 9 || !tripId || !isProgressHydrated) return;
    let cancelled = false;
    setCrisisReady(false);
    setCrisisPayload(null);
    fetch(`/api/trips/${tripId}/crisis?delayMinutes=90`)
      .then((r) => r.json() as Promise<CrisisPayload>)
      .then((data) => { if (!cancelled) setCrisisPayload(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCrisisReady(true); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, tripId, isProgressHydrated]);

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
    setThinking(true);
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
        setThinking(false);
        void say("I didn't quite catch that. Could you try again?", "empathetic");
      }
    } catch {
      setThinking(false);
      void say("I'm having trouble with voice right now. Please try again.", "empathetic");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleMicClick() {
    if (isListening) stopListening();
    else startListening();
  }

  function handleRoadmapOpen() { setRoadmapOpen(true); }
  function handleRoadmapClose() { setRoadmapOpen(false); }
  function handleChatToggle() { setChatMode((v) => !v); }

  async function handleChatSend() {
    if (!chatInput.trim() || isProcessing) return;
    const text = chatInput.trim();
    setChatInput("");
    await handleUserSpeech(text);
  }

  function handleOpenSheet() {
    setOverlayReady(true);
    setOverlayDismissed(false);
  }

  async function handleUserSpeech(userText: string) {
    const msgs: ConversationMessage[] = [
      ...conversationMessages,
      { role: "user", content: userText },
    ];
    setConversationMessages(msgs);
    setThinking(true);

    try {
      const res = await fetch("/api/demo/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, frameIndex: currentIndex, knownFields }),
      });
      const resJson = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error(typeof resJson.error === "string" ? resJson.error : "Conversation failed");
      const data = resJson as {
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
          originCity: data.extractedData.originCity ?? "Chicago",
          departure: data.extractedData.departure,
          returnDate: data.extractedData.return,
          passportExpiry: data.extractedData.passportExpiry,
          purpose: data.extractedData.purpose ?? "",
        });
      }

      setConversationMessages([...msgs, { role: "assistant", content: data.mascotMessage, frameIndex: currentIndex }]);
      setThinking(false);
      await say(data.mascotMessage, data.tone);
      if (data.extractedData && currentIndex === 0) setOverlayReady(true);
    } catch {
      setThinking(false);
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
          selectedReturn,
          bundle: selectedBundle,
          liveFlightGroups: liveFlightResults,
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
    const trip = tripData ?? DEMO_DEFAULTS;
    const flightGroup = liveFlights?.[selectedFlight] ?? DEMO_FLIGHT_GROUPS[selectedFlight] ?? DEMO_FLIGHT_GROUPS[0];
    const returnFlight = flightGroup.returns[selectedReturn] ?? flightGroup.returns[0];
    const bundle = DEMO_BUNDLES[selectedBundle ?? 2];
    const hotel = DEMO_HOTELS.find(h => h.id === bundle.hotelId) ?? DEMO_HOTELS[0];
    const destAirport = CITY_TO_AIRPORT[trip.city.toLowerCase()] ?? "MXP";
    const depDate = new Date(trip.departure);
    const retDate = new Date(trip.returnDate);
    const nights = Math.round((retDate.getTime() - depDate.getTime()) / 86400000);
    const depStr = depDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const retStr = retDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const flightPriceUsd = returnFlight?.totalPriceUsd ?? flightGroup.returns[0]?.totalPriceUsd ?? 687;

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
        return <FlightPicker groups={liveFlights} onOutboundChange={setSelectedFlight} onReturnChange={setSelectedReturn} returnValue={selectedReturn} value={selectedFlight} />;
      case 3: return (
        <ComplianceReport
          country={trip.country}
          depStr={depStr}
          flightCapUsd={DEMO_POLICY.flightCapUsd}
          flightNumber={flightGroup.flightNumber}
          flightPriceUsd={flightPriceUsd}
          hotelCapUsd={DEMO_POLICY.hotelNightlyCapUsd}
          hotelName={hotel.name}
          hotelPriceUsd={hotel.pricePerNightUsd}
          nights={nights}
          retStr={retStr}
        />
      );
      case 4: return <BundlePicker value={selectedBundle} onChange={setSelectedBundle} />;
      case 5: return (
        <ApprovalEmail
          city={trip.city}
          country={trip.country === "IT" ? "Italy" : trip.country}
          depStr={depStr}
          flightNumber={flightGroup.flightNumber}
          flightPriceUsd={flightPriceUsd}
          flightRoute={flightGroup.route}
          hotelCapUsd={DEMO_POLICY.hotelNightlyCapUsd}
          hotelName={hotel.name}
          hotelPriceUsd={hotel.pricePerNightUsd}
          nights={nights}
          purpose={trip.purpose || "on-site client meeting"}
          retStr={retStr}
          totalCostUsd={bundle.totalCostUsd}
        />
      );
      case 6: {
        const altHotel = DEMO_HOTELS.find(h => h.id !== bundle.hotelId && h.pricePerNightUsd <= DEMO_POLICY.hotelNightlyCapUsd) ?? DEMO_HOTELS[1];
        return (
          <HotelComparison
            altDist={`${altHotel.distanceKm} km`}
            altName={altHotel.name}
            altPreferred={altHotel.isPreferred}
            altPrice={altHotel.pricePerNightUsd}
            capUsd={DEMO_POLICY.hotelNightlyCapUsd}
            nights={nights}
            rejectedDist={`${hotel.distanceKm} km`}
            rejectedName={hotel.name}
            rejectedPreferred={hotel.isPreferred}
            rejectedPrice={hotel.pricePerNightUsd}
          />
        );
      }
      case 7: return (
        <PrepChecklist
          country={trip.country}
          departure={trip.departure}
          depStr={depStr}
          flightNumber={flightGroup.flightNumber}
          hotelAddress={hotel.address}
          hotelName={hotel.name}
          passportExpiry={trip.passportExpiry}
        />
      );
      case 8: return (
        <LiveDashboard
          dep={flightGroup.dep}
          destAirport={destAirport}
          destCity={trip.city}
          flightNumber={flightGroup.flightNumber}
          hotelName={hotel.name}
        />
      );
      case 9: return <DemoCrisisPanel payload={crisisReady ? crisisPayload : undefined} tripId={tripId} />;
      case 10: {
        const altFlight = crisisPayload?.alternative;
        return (
          <ExceptionEmail
            altFlight={altFlight ? `${altFlight.carrier} ${altFlight.flightNumber}` : REBOOKED_FLIGHT.flightNumber}
            altPriceUsd={altFlight?.priceUsd ?? REBOOKED_FLIGHT.priceUsd}
            destCity={trip.city}
            origFlight={flightGroup.flightNumber}
            origPriceUsd={flightPriceUsd}
            origRoute={flightGroup.route}
          />
        );
      }
      case 11: return (
        <ArrivalSupport
          destAirport={destAirport}
          hotelAddress={hotel.address}
          hotelName={hotel.name}
        />
      );
      case 13: return <ContactCards country={trip.country} />;
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
        chatInput={chatInput}
        chatMessages={conversationMessages}
        chatMode={chatMode}
        currentFrameIndex={currentIndex}
        frameCompleted={frameCompleted}
        isListening={isListening}
        isProcessing={isProcessing}
        onChatInputChange={setChatInput}
        onChatSend={() => void handleChatSend()}
        onChatToggle={handleChatToggle}
        onEllipsisOpen={handleEllipsisOpen}
        onMicClick={handleMicClick}
        onOpenSheet={handleOpenSheet}
        onRoadmapClose={handleRoadmapClose}
        onRoadmapOpen={handleRoadmapOpen}
        onSheetClose={handleSheetClose}
        roadmapOpen={roadmapOpen}
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
