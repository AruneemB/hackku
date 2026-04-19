"use client";

import React, { useEffect, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { ArrowBigLeft, Ellipsis, Pencil, Plane, Send as SendIcon } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { useMascot } from "@/hooks/useMascot";
import type { FlightGroup } from "@/types/flight";
import type { Hotel } from "@/types/hotel";
import styles from "./page.module.css";
import dynamic from "next/dynamic";

const DynamicHotelMap = dynamic(() => import("@/components/map/LeafletHotelMap"), { ssr: false });

// ── Types ──────────────────────────────────────────────────────

type Tone = "neutral" | "excited" | "empathetic" | "urgent";

type ManagerPollResult = {
  found: boolean;
  noAuth?: boolean;
  status?: "approved" | "rejected";
  reason?: string;
  flaggedItems?: string[];
  changes?: { hotel?: string; flight?: string; dates?: string; budget?: string };
  snippet?: string;
};

type TripData = {
  city: string;
  country: string;
  originCity: string;
  departure: string;
  returnDate: string;
  passportExpiry: string;
  purpose: string;
  approvalThread?: {
    status: string;
    reason: string | null;
    flaggedItems?: string[];
  };
};

type ConversationMessage = { role: "user" | "assistant"; content: string; frameIndex?: number };

type DemoFrame = {
  frameNumber: number;
  tone: Tone;
  message: string;
  sheetTitle: string;
  options: [string, string];
  Visual: React.ComponentType<any>;
  actionTitle: string;
  ActionVisual: React.ComponentType<any>;
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
  selectedHotel: number;
  selectedReturn: number;
  selectedBundle: number | null;
};

// ── Demo data (hardcoded for unimplemented integrations) ───────

const DEMO_DEFAULTS: TripData = {
  city: "Milan",
  country: "IT",
  originCity: "",
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
  chicago: "ORD", milwaukee: "MKE", omaha: "OMA",
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

const COUNTRY_CODES: Record<string, string> = {
  IT: "Italy", FR: "France", DE: "Germany", ES: "Spain", GB: "United Kingdom",
  NL: "Netherlands", PT: "Portugal", CH: "Switzerland", JP: "Japan",
  AE: "UAE", SG: "Singapore", AU: "Australia", CA: "Canada", MX: "Mexico",
  US: "United States",
};

function expandCountry(code: string): string {
  return COUNTRY_CODES[code.toUpperCase()] ?? code;
}

function fmtDateRange(departure: string, returnDate: string): string {
  const dep = new Date(departure);
  const ret = new Date(returnDate);
  const depStr = dep.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const retDay = ret.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
  const year = ret.getUTCFullYear();
  return `${depStr}–${retDay}, ${year}`;
}

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
const HIDDEN_FRAME_INDEXES = new Set([4, 12, 15]);

function isVisibleFrameIndex(index: number): boolean {
  return index >= 0 && index < FRAMES.length && !HIDDEN_FRAME_INDEXES.has(index);
}

function getNearestVisibleFrameIndex(index: number): number {
  if (isVisibleFrameIndex(index)) return index;

  for (let next = index + 1; next < FRAMES.length; next += 1) {
    if (isVisibleFrameIndex(next)) return next;
  }

  for (let prev = index - 1; prev >= 0; prev -= 1) {
    if (isVisibleFrameIndex(prev)) return prev;
  }

  return 0;
}

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
  sel: { flight: number; hotel: number; selectedReturn?: number; bundle: number | null; liveFlightGroups?: FlightGroup[] | null; liveDisplayFlights?: DisplayFlightGroup[] | null; liveHotels?: Hotel[] | null; tripData?: TripData | null; skipPatch?: boolean }
) {
  const liveGroup = sel.liveFlightGroups?.[sel.flight];
  const flight = liveGroup?.outbound ?? DEMO_FLIGHT_GROUPS[sel.flight] ?? DEMO_FLIGHT_GROUPS[0];
  const bundle = sel.bundle !== null ? DEMO_BUNDLES[sel.bundle] : DEMO_BUNDLES[2];

  switch (frameIdx) {
    case 1:
      await patchTrip(tripId, { flights: [flight] });
      break;
    case 2: {
      const hotel = sel.liveHotels?.[sel.hotel] ?? DEMO_HOTELS[sel.hotel] ?? DEMO_HOTELS[0];
      await patchTrip(tripId, { hotels: [hotel] });
      break;
    }
    case 3:
      await patchTrip(tripId, { policyFindings: DEMO_POLICY });
      break;
    case 4:
      await patchTrip(tripId, { selectedBundle: bundle });
      break;
    case 5: {
      const td = sel.tripData;
      const homeCode = td?.originCity ? (CITY_TO_AIRPORT[td.originCity.toLowerCase()] ?? td.originCity.substring(0, 3).toUpperCase()) : "ORD";
      const destCode = td?.city ? (CITY_TO_AIRPORT[td.city.toLowerCase()] ?? td.city.substring(0, 3).toUpperCase()) : "MXP";
      const destCity = td?.city ?? "Milan";
      const destCountry = expandCountry(td?.country ?? "Italy");
      const dateRange = td?.departure && td?.returnDate ? fmtDateRange(td.departure, td.returnDate) : "Sep 14–19, 2025";
      const flightNum = sel.liveDisplayFlights?.[sel.flight]?.flightNumber ?? liveGroup?.outbound?.outbound?.flightNumber ?? DEMO_FLIGHT_GROUPS[sel.flight]?.flightNumber ?? "LH 8904";
      const flightPrice = liveGroup?.outbound?.priceUsd ?? 687;
      const hotelData = (sel.liveHotels?.[sel.hotel] as any) ?? DEMO_HOTELS[sel.hotel] ?? DEMO_HOTELS[0];
      const hotelName: string = hotelData?.name ?? "not selected";
      const hotelRate: number = (hotelData as Hotel)?.nightlyRateUsd ?? (hotelData as any)?.pricePerNightUsd ?? 0;
      const nights = td?.departure && td?.returnDate
        ? Math.round((new Date(td.returnDate).getTime() - new Date(td.departure).getTime()) / 86400000)
        : 5;
      const hotelTotal = hotelRate * nights;
      const overCap = hotelRate > 200;
      const managerEmail = process.env.NEXT_PUBLIC_MANAGER_EMAIL;
      if (managerEmail && managerEmail !== "PLACEHOLDER") {
        const hotelLine = hotelRate > 0
          ? `Hotel: ${hotelName} · $${hotelRate}/night x ${nights} = $${hotelTotal}${overCap ? `\nNote: Hotel is $${hotelRate - 200} over the $200 cap - closest preferred vendor to client office.` : ""}`
          : "Hotel: not selected";
        const emailBody = [
          "Hi,",
          "",
          `I'm requesting approval for a business trip to ${destCity}, ${destCountry}, ${dateRange} for an on-site client meeting.`,
          "",
          `Flight: ${flightNum}, ${homeCode} to ${destCode} · $${flightPrice} (nonstop)`,
          hotelLine,
          "",
          `Total estimated: $${flightPrice + hotelTotal}. Please let me know if you have any questions.`,
          "",
          "Thanks,",
          "Lockey",
        ].join("\n");
        const gmailRes = await fetch("/api/auth/gmail-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: managerEmail, subject: `Travel Approval - ${destCity}, ${dateRange}`, body: emailBody }),
        });
        if (!gmailRes.ok) {
          const gmailErr = await gmailRes.json().catch(() => ({}));
          console.error("[slide6] gmail-send failed", gmailRes.status, gmailErr);
          throw new Error(gmailErr.error ?? `gmail-send ${gmailRes.status}`);
        }
        console.log("[slide6] email sent to", managerEmail);
      }
      if (!sel.skipPatch) {
        await patchTrip(tripId, {
          status: "pending_approval",
          approvalThread: { gmailThreadId: "demo-thread-001", status: "pending", reason: null },
        });
      }
      break;
    }
    case 6: {
      const altHotel = sel.liveHotels?.find((h) => !h.overPolicyCap) ?? sel.liveHotels?.[1] ?? DEMO_HOTELS[1];
      await patchTrip(tripId, {
        hotels: [altHotel],
        approvalThread: { gmailThreadId: "demo-thread-002", status: "pending", reason: null },
      });
      break;
    }
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

function isPassportExpiringSoon(passportExpiry: string, departure: string): boolean {
  const expiry = new Date(passportExpiry);
  const dep = new Date(departure);
  dep.setMonth(dep.getMonth() - 6);
  return expiry <= dep;
}

// ── Visual components ──────────────────────────────────────────

function TripCard({ tripData, travelerName }: { tripData?: TripData | null; travelerName?: string }) {
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
          ["Traveler", travelerName ?? "—"],
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
                    key={`${r.id}-${ri}`}
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

function formatTripDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function getTripLengthDays(start: string, end: string) {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function parseRouteAirports(route: string) {
  return route
    .split(/\s*(?:→|â†’|->)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getStopDetail(route: string) {
  const airports = parseRouteAirports(route);
  const vias = airports.slice(1, -1);
  if (vias.length === 0) return "Nonstop";
  return `${vias.length === 1 ? "1 stop" : `${vias.length} stops`} · ${vias.join(", ")}`;
}

function FlightPickerV2({
  value, onOutboundChange, returnValue, onReturnChange, groups, tripData,
}: {
  value?: number;
  onOutboundChange?: (i: number) => void;
  returnValue?: number;
  onReturnChange?: (i: number) => void;
  groups?: DisplayFlightGroup[] | null;
  tripData?: TripData | null;
}) {
  const [localSel, setLocalSel] = useState(0);
  const [localRetSel, setLocalRetSel] = useState(0);
  const sel = value ?? localSel;
  const retSel = returnValue ?? localRetSel;
  const activeTrip = tripData ?? DEMO_DEFAULTS;
  const list = (groups?.length ? groups : DEMO_FLIGHT_GROUPS).map(g => {
    const homeAirport = activeTrip.originCity ? (CITY_TO_AIRPORT[activeTrip.originCity.toLowerCase()] ?? activeTrip.originCity.substring(0, 3).toUpperCase()) : "ORD";
    if (g.route.startsWith("ORD") && homeAirport !== "ORD") {
      return { ...g, route: g.route.replace("ORD", homeAirport) };
    }
    return g;
  });
  const tripLengthDays = getTripLengthDays(activeTrip.departure, activeTrip.returnDate);

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
    <div className={styles.fpWrap}>
      {/* Route + date header */}
      <div className={styles.fpHeader}>
        <span className={styles.fpRoute}>{activeTrip.originCity} → {activeTrip.city}</span>
        <span className={styles.fpHeaderMeta}>
          {formatTripDateLabel(activeTrip.departure)} – {formatTripDateLabel(activeTrip.returnDate)}
          {tripLengthDays ? ` · ${tripLengthDays} nights` : ""}
        </span>
      </div>

      {/* Outbound + inline returns */}
      <div className={styles.fpCards}>
        {list.map((g, i) => {
          const isSelected = sel === i;
          const airports = parseRouteAirports(g.route);
          const depCode = airports[0] ?? "";
          const arrCode = airports[airports.length - 1] ?? "";
          const minPrice = g.returns.reduce((m, r) => Math.min(m, r.totalPriceUsd), Infinity);
          return (
            <div key={g.id} className={styles.fpFlightGroup}>
              <button
                className={[styles.fpCard, isSelected ? styles.fpCardSelected : ""].join(" ")}
                onClick={() => selectOutbound(i)}
                type="button"
              >
                <div className={styles.fpCardTop}>
                  <span className={styles.fpAirline}>{g.carrier} · {g.flightNumber}</span>
                  {tags[i] && (
                    <span className={[styles.cardTag, isSelected ? styles.cardTagSelected : ""].join(" ")}>
                      {tags[i]}
                    </span>
                  )}
                </div>
                <div className={styles.fpTimes}>
                  <span className={styles.fpTimeVal}>{g.dep}</span>
                  <div className={styles.fpArrowWrap}>
                    <div className={styles.fpArrowLine} />
                    <Plane className={styles.fpArrowPlane} size={11} />
                    <div className={styles.fpArrowLine} />
                  </div>
                  <span className={styles.fpTimeVal}>{g.arr}</span>
                </div>
                <div className={styles.fpAirports}>
                  <span className={styles.fpAirport}>{depCode}</span>
                  <span className={[styles.fpAirport, styles.fpAirportRight].join(" ")}>{arrCode}</span>
                </div>
                <div className={styles.fpCardBottom}>
                  <span className={styles.fpStopsMeta}>{getStopDetail(g.route)} · {g.dur}</span>
                  {minPrice !== Infinity && <span className={styles.fpFromPrice}>from ${minPrice}</span>}
                </div>
              </button>

              {isSelected && g.returns.length > 0 && (
                <div className={styles.fpReturnsInline}>
                  <span className={styles.fpReturnInlineLabel}>↩ Return</span>
                  <div className={styles.fpReturnRows}>
                    {g.returns.map((r, ri) => {
                      const isRetSel = retSel === ri;
                      return (
                        <button
                          key={`${r.id}-${ri}`}
                          className={[styles.fpReturnRow, isRetSel ? styles.fpReturnRowSelected : ""].join(" ")}
                          onClick={() => selectReturn(ri)}
                          type="button"
                        >
                          <div className={[styles.fpRadioDot, isRetSel ? styles.fpRadioDotSelected : ""].join(" ")}>
                            {isRetSel && <div className={styles.fpRadioInner} />}
                          </div>
                          <div className={styles.fpReturnRowBody}>
                            <div className={styles.fpReturnRowTimeLine}>
                              <span className={styles.fpReturnTime}>{r.dep}</span>
                              <div className={styles.fpArrowWrap}>
                                <div className={styles.fpArrowLine} />
                                <Plane className={styles.fpArrowPlane} size={10} />
                                <div className={styles.fpArrowLine} />
                              </div>
                              <span className={styles.fpReturnTime}>{r.arr}</span>
                            </div>
                            <div className={styles.fpReturnRowBottom}>
                              <span className={styles.fpReturnRowMeta}>
                                {r.returnDate} · {r.flightNumber}{r.returnVia ? ` · ${r.returnVia}` : ""} · {r.dur}
                              </span>
                              <span className={styles.fpReturnRowPrice}>${r.totalPriceUsd}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
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

function ComplianceReport({ selectedHotel, liveHotels, selectedFlight, liveFlights, tripData }: { selectedHotel?: number; liveHotels?: Hotel[] | null; selectedFlight?: number; liveFlights?: DisplayFlightGroup[] | null; tripData?: TripData | null }) {
  const hotelData = (liveHotels?.[selectedHotel ?? 0] as any) ?? DEMO_HOTELS[selectedHotel ?? 0] ?? DEMO_HOTELS[0];
  const hotelName: string = hotelData?.name ?? "Marriott Scala";
  const hotelRate: number = (hotelData as Hotel)?.nightlyRateUsd ?? (hotelData as any)?.pricePerNightUsd ?? 247;
  const overCap = hotelRate > 200;
  const flightNum: string = liveFlights?.[selectedFlight ?? 0]?.flightNumber ?? DEMO_FLIGHT_GROUPS[selectedFlight ?? 0]?.flightNumber ?? "LH 8904";
  const nights = tripData?.departure && tripData?.returnDate
    ? Math.round((new Date(tripData.returnDate).getTime() - new Date(tripData.departure).getTime()) / 86400000)
    : 5;
  const dateRange = tripData?.departure && tripData?.returnDate ? fmtDateRange(tripData.departure, tripData.returnDate) : "Sep 14–19, 2025";
  const destCity = tripData?.city ?? "Milan";
  return (
    <div className={styles.complianceList}>
      <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
        <span className={styles.complianceIcon}>⚠️</span>
        <div>
          <div className={styles.complianceTitle}>Type-C Visa Required</div>
          <div className={styles.complianceBody}>US citizens must apply ≥ 15 days before departure</div>
        </div>
      </div>
      {overCap && (
        <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
          <span className={styles.complianceIcon}>⚠️</span>
          <div>
            <div className={styles.complianceTitle}>Hotel Exception Needed</div>
            <div className={styles.complianceBody}>{hotelName} at ${hotelRate}/night exceeds the $200 {destCity} cap</div>
          </div>
        </div>
      )}
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Flight within budget</div>
          <div className={styles.complianceBody}>{flightNum} · approved cap is $800</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Travel dates policy-compliant</div>
          <div className={styles.complianceBody}>{dateRange} · {nights}-night stay · within 10-day maximum</div>
        </div>
      </div>
    </div>
  );
}

function ApprovalEmail({ tripData, selectedHotel, liveHotels, selectedFlight }: { tripData?: TripData | null; selectedHotel?: number; liveHotels?: Hotel[] | null; selectedFlight?: number }) {
  const homeCode = tripData?.originCity ? (CITY_TO_AIRPORT[tripData.originCity.toLowerCase()] ?? tripData.originCity.substring(0, 3).toUpperCase()) : "ORD";
  const destCode = tripData?.city ? (CITY_TO_AIRPORT[tripData.city.toLowerCase()] ?? tripData.city.substring(0, 3).toUpperCase()) : "MXP";
  const destCity = tripData?.city ?? "Milan";
  const destCountry = expandCountry(tripData?.country ?? "Italy");
  const dateRange = tripData?.departure && tripData?.returnDate ? fmtDateRange(tripData.departure, tripData.returnDate) : "Sep 14–19, 2025";
  const managerEmail = process.env.NEXT_PUBLIC_MANAGER_EMAIL || "PLACEHOLDER";

  const hotelData = (liveHotels?.[selectedHotel ?? 0] as any) ?? DEMO_HOTELS[selectedHotel ?? 0] ?? DEMO_HOTELS[0];
  const hotelName: string = hotelData?.name ?? "not selected";
  const hotelRate: number = (hotelData as Hotel)?.nightlyRateUsd ?? (hotelData as any)?.pricePerNightUsd ?? 0;
  const nights = tripData?.departure && tripData?.returnDate
    ? Math.round((new Date(tripData.returnDate).getTime() - new Date(tripData.departure).getTime()) / 86400000)
    : 5;
  const hotelTotal = hotelRate * nights;
  const overCap = hotelRate > 200;

  const flightGroup = DEMO_FLIGHT_GROUPS[selectedFlight ?? 0] ?? DEMO_FLIGHT_GROUPS[0];
  const flightNum = flightGroup.flightNumber;

  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>{managerEmail}</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Travel Approval - {destCity}, {dateRange}</span></div>
      <div className={styles.emailBody}>
        <p>Hi,</p>
        <p>I&#39;m requesting approval for a business trip to <strong>{destCity}, {destCountry}, {dateRange}</strong> for an on-site client meeting.</p>
        <p>
          <strong>Flight:</strong> {flightNum}, {homeCode} to {destCode} (nonstop)<br />
          {hotelRate > 0 ? (
            <><strong>Hotel:</strong> {hotelName} · ${hotelRate}/night x {nights} = ${hotelTotal}<br /></>
          ) : (
            <><strong>Hotel:</strong> not selected<br /></>
          )}
          {overCap && <><strong>Note:</strong> Hotel is ${hotelRate - 200} over the $200 cap - closest preferred vendor to client office.</>}
        </p>
        <p>Total estimated: ${hotelRate > 0 ? hotelTotal : 0}. Please let me know if you have any questions.</p>
        <p>Thanks,<br />Lockey</p>
      </div>
    </div>
  );
}

function HotelComparison({ selectedHotel, liveHotels }: { selectedHotel?: number; liveHotels?: Hotel[] | null }) {
  const rejIdx = selectedHotel ?? 0;
  const rejData = (liveHotels?.[rejIdx] as any) ?? DEMO_HOTELS[rejIdx] ?? DEMO_HOTELS[0];
  const rejName: string = rejData?.name ?? "Marriott Scala";
  const rejRate: number = (rejData as Hotel)?.nightlyRateUsd ?? (rejData as any)?.pricePerNightUsd ?? 247;
  const rejDist: number = (rejData as Hotel)?.distanceFromOfficeKm ?? (rejData as any)?.distanceKm ?? 0.4;
  const altIdx = liveHotels
    ? (liveHotels.findIndex((h, i) => i !== rejIdx && !h.overPolicyCap) ?? 1)
    : rejIdx === 0 ? 1 : 0;
  const altData = (liveHotels?.[altIdx < 0 ? 1 : altIdx] as any) ?? DEMO_HOTELS[altIdx < 0 ? 1 : altIdx] ?? DEMO_HOTELS[1];
  const altName: string = altData?.name ?? "AC Hotel Milan";
  const altRate: number = (altData as Hotel)?.nightlyRateUsd ?? (altData as any)?.pricePerNightUsd ?? 189;
  const altDist: number = (altData as Hotel)?.distanceFromOfficeKm ?? (altData as any)?.distanceKm ?? 1.2;
  return (
    <div className={styles.compareGrid}>
      <div className={[styles.compareCard, styles.compareRejected].join(" ")}>
        <div className={styles.compareBadge}>Rejected ✗</div>
        <div className={styles.compareName}>{rejName}</div>
        <div className={styles.comparePrice}>${rejRate} / night</div>
        <div className={styles.compareMeta}>⭐ Preferred vendor</div>
        <div className={styles.compareMeta}>{rejDist} km from office</div>
        <div className={styles.compareReason}>${rejRate - 200} over the $200 cap</div>
      </div>
      <div className={[styles.compareCard, styles.compareApproved].join(" ")}>
        <div className={styles.compareBadge}>Alternative ✓</div>
        <div className={styles.compareName}>{altName}</div>
        <div className={styles.comparePrice}>${altRate} / night</div>
        <div className={styles.compareMeta}>⭐ Preferred vendor</div>
        <div className={styles.compareMeta}>{altDist} km from office</div>
        <div className={styles.compareReason}>Saves ${(rejRate - altRate) * 5} total · fully compliant</div>
      </div>
    </div>
  );
}

function FlightComparison({ tripData, liveFlights, onChange }: { tripData?: TripData | null, liveFlights?: DisplayFlightGroup[] | null, onChange?: (i: number) => void }) {
  // Find a cheaper flight than the current "Best pick"
  const baselineCost = liveFlights?.[0]?.returns?.[0]?.totalPriceUsd ?? 687;
  const compliantFlight = liveFlights?.find(f => (f.returns?.[0]?.totalPriceUsd ?? Infinity) < baselineCost) || liveFlights?.[1] || DEMO_FLIGHT_GROUPS[2];

  return (
    <div className={styles.compareGrid}>
      <div className={[styles.compareCard, styles.compareRejected].join(" ")}>
        <div className={styles.compareBadge}>Rejected ✗</div>
        <div className={styles.compareName}>{liveFlights?.[0]?.flightNumber ?? "LH 8904"}</div>
        <div className={styles.comparePrice}>${baselineCost} total</div>
        <div className={styles.compareMeta}>⭐ Best flight times</div>
        <div className={styles.compareMeta}>Nonstop</div>
        <div className={styles.compareReason}>{tripData?.approvalThread?.reason || "Flight over budget"}</div>
      </div>
      <div className={[styles.compareCard, styles.compareApproved].join(" ")}>
        <div className={styles.compareBadge}>Alternative ✓</div>
        <div className={styles.compareName}>{compliantFlight.flightNumber}</div>
        <div className={styles.comparePrice}>${compliantFlight.returns?.[0]?.totalPriceUsd ?? 607} total</div>
        <div className={styles.compareMeta}>Alternative carrier</div>
        <div className={styles.compareMeta}>1 Stop</div>
        <div className={styles.compareReason}>Saves $${baselineCost - (compliantFlight.returns?.[0]?.totalPriceUsd ?? 607)} · fully compliant</div>
      </div>
    </div>
  );
}

function PrepChecklist({ selectedHotel, liveHotels, tripData }: { selectedHotel?: number; liveHotels?: Hotel[] | null; tripData?: TripData | null }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const hotelData = (liveHotels?.[selectedHotel ?? 0] as any) ?? DEMO_HOTELS[selectedHotel ?? 0] ?? DEMO_HOTELS[0];
  const hotelName: string = hotelData?.name ?? "Marriott Scala";
  const hotelAddress: string = (hotelData as Hotel)?.address ?? (hotelData as any)?.address ?? "Via della Spiga 31";
  const checkIn = tripData?.departure
    ? new Date(tripData.departure).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : "Sep 14";
  const passportExpiry = tripData?.passportExpiry
    ? new Date(tripData.passportExpiry).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    : "Jan 2025";
  const items = [
    { text: "Apply for Type-C Visa at italyvisa.com", urgent: true },
    { text: `Renew passport after trip (expires ${passportExpiry})`, urgent: true },
    { text: "Pack for 24°C, light rain expected on days 2 to 4" },
    { text: `${hotelName} · ${hotelAddress} · Check-in ${checkIn} at 3:00 PM` },
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

function LiveDashboard({ selectedFlight, liveFlights, selectedHotel, liveHotels, tripData }: { selectedFlight?: number; liveFlights?: DisplayFlightGroup[] | null; selectedHotel?: number; liveHotels?: Hotel[] | null; tripData?: TripData | null }) {
  const flightNum = liveFlights?.[selectedFlight ?? 0]?.flightNumber ?? DEMO_FLIGHT_GROUPS[selectedFlight ?? 0]?.flightNumber ?? "LH 8904";
  const depTime = liveFlights?.[selectedFlight ?? 0]?.dep ?? "8:45 AM";
  const destCity = tripData?.city ?? "Milan";
  const destCode = tripData?.city ? (CITY_TO_AIRPORT[tripData.city.toLowerCase()] ?? "MXP") : "MXP";
  const hotelData = (liveHotels?.[selectedHotel ?? 0] as any) ?? DEMO_HOTELS[selectedHotel ?? 0] ?? DEMO_HOTELS[0];
  const hotelName: string = hotelData?.name ?? "Marriott Scala";
  return (
    <div className={styles.dashboard}>
      {[
        { icon: "✈️", title: `${flightNum} · Gate B22`, sub: `Boards ${depTime} · Departs ${depTime}`, badge: "On time" },
        { icon: "🌤️", title: `${destCity} · 24 °C`, sub: "Partly cloudy · Low 18 °C tonight", badge: "" },
        { icon: "🏨", title: `${hotelName} · Room 412`, sub: "Check-in ready from 3:00 PM", badge: "Ready" },
        { icon: "🚗", title: `Traffic to ${destCode} · 32 min`, sub: "Leave by 7:00 AM to make your gate", badge: "" },
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

function FlightRebooking({ tripData, selectedFlight, liveFlights }: { tripData?: TripData | null; selectedFlight?: number; liveFlights?: DisplayFlightGroup[] | null }) {
  const homeCode = tripData?.originCity ? (CITY_TO_AIRPORT[tripData.originCity.toLowerCase()] ?? tripData.originCity.substring(0, 3).toUpperCase()) : "ORD";
  const destCode = tripData?.city ? (CITY_TO_AIRPORT[tripData.city.toLowerCase()] ?? "MXP") : "MXP";
  const flightNum = liveFlights?.[selectedFlight ?? 0]?.flightNumber ?? DEMO_FLIGHT_GROUPS[selectedFlight ?? 0]?.flightNumber ?? "LH 8904";
  const depTime = liveFlights?.[selectedFlight ?? 0]?.dep ?? "8:45 AM";
  return (
    <div className={styles.rebooking}>
      <div className={[styles.rebookCard, styles.rebookOld].join(" ")}>
        <div className={styles.rebookBadge}>Original · Cancelled ✗</div>
        <div className={styles.rebookFlight}>{flightNum} &nbsp;·&nbsp; {homeCode} → {destCode}</div>
        <div className={styles.rebookTime}>Departs {depTime}</div>
        <div className={styles.rebookMeta}>Thunderstorm at {homeCode} · missed connection</div>
      </div>
      <div className={styles.rebookArrow}>↓ rebooked automatically</div>
      <div className={[styles.rebookCard, styles.rebookNew].join(" ")}>
        <div className={styles.rebookBadge}>New booking · Confirmed ✓</div>
        <div className={styles.rebookFlight}>LH 9012 &nbsp;·&nbsp; {homeCode} → MXP</div>
        <div className={styles.rebookTime}>Departs 9:00 PM</div>
        <div className={styles.rebookMeta}>Same carrier · No change fee · Seat 14A · Hotel notified ✓</div>
      </div>
    </div>
  );
}

function ExceptionEmail({ tripData, selectedFlight, liveFlights }: { tripData?: TripData | null; selectedFlight?: number; liveFlights?: DisplayFlightGroup[] | null }) {
  const managerEmail = process.env.NEXT_PUBLIC_MANAGER_EMAIL ?? "mgr.sarah@lockton.com";
  const homeCode = tripData?.originCity ? (CITY_TO_AIRPORT[tripData.originCity.toLowerCase()] ?? tripData.originCity.substring(0, 3).toUpperCase()) : "ORD";
  const homeCity = tripData?.originCity ?? "Chicago";
  const destCity = tripData?.city ?? "Milan";
  const flightNum = liveFlights?.[selectedFlight ?? 0]?.flightNumber ?? DEMO_FLIGHT_GROUPS[selectedFlight ?? 0]?.flightNumber ?? "LH 8904";
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>{managerEmail}</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Priority</span><span className={[styles.emailVal, styles.emailUrgent].join(" ")}>HIGH - Action required</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Emergency Exception - {destCity} Rebooking</span></div>
      <div className={styles.emailBody}>
        <p>Hi,</p>
        <p><strong>{flightNum} was cancelled due to a thunderstorm</strong> at {homeCity}. The only available rebooking is LH 9012 at <strong>$1,067</strong>, which is $380 over the approved budget.</p>
        <p>Force majeure - requesting emergency exception. Hotel hold expires in 2 hours.</p>
        <p>Lockey</p>
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

function SpendSummary({ tripData }: { tripData?: TripData | null }) {
  const nights = tripData?.departure && tripData?.returnDate
    ? Math.round((new Date(tripData.returnDate).getTime() - new Date(tripData.departure).getTime()) / 86400000)
    : 5;
  const cats = [
    { name: "Flights", spent: 687, budget: 800 },
    { name: `Hotel (${nights} nights)`, spent: 945, budget: 1000 },
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

function PrivacySummary({ tripData }: { tripData?: TripData | null }) {
  const dateRange = tripData?.departure && tripData?.returnDate ? fmtDateRange(tripData.departure, tripData.returnDate) : "Sep 14–19, 2025";
  return (
    <div className={styles.privacyList}>
      {[
        { icon: "📍", label: "Location tracking", detail: `Active ${dateRange} only`, status: "Stopped" },
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

function TripConfirmed({ tripData }: { tripData?: TripData | null }) {
  const city = tripData?.city ?? "Milan";
  const dateRange = tripData?.departure && tripData?.returnDate ? fmtDateRange(tripData.departure, tripData.returnDate) : "Sep 14–19, 2025";
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>✅</span>
        <div className={styles.confirmTitle}>Trip Draft Saved</div>
        <div className={styles.confirmBody}>{city} · {dateRange} · Trip is now active in your travel dashboard.</div>
      </div>
    </div>
  );
}

function FlightConfirmed({ tripData }: { tripData?: TripData | null }) {
  const homeCode = tripData?.originCity ? (CITY_TO_AIRPORT[tripData.originCity.toLowerCase()] ?? tripData.originCity.substring(0, 3).toUpperCase()) : "ORD";
  const homeCity = tripData?.originCity || "Chicago";
  return (
    <div className={styles.eticket}>
      <div className={styles.eticketRow}>
        <div className={styles.eticketAirport}><div className={styles.eticketCode}>{homeCode}</div><div className={styles.eticketCity}>{homeCity}</div></div>
        <div className={styles.eticketPlane}>✈</div>
        <div className={[styles.eticketAirport, styles.eticketAirportRight].join(" ")}><div className={styles.eticketCode}>MXP</div><div className={styles.eticketCity}>Milan</div></div>
      </div>
      <div className={styles.eticketGrid}>
        {[["Flight", "LH 8904"], ["Date", "Sep 14, 2025"], ["Departs", "8:45 AM"], ["Seat", "14A (Window)"], ["PNR", "XKMR74"], ["Class", "Economy"]].map(([k, v]) => (
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

function BundleConfirmed({ tripData }: { tripData?: TripData | null }) {
  const homeCode = tripData?.originCity ? (CITY_TO_AIRPORT[tripData.originCity.toLowerCase()] ?? tripData.originCity.substring(0, 3).toUpperCase()) : "ORD";
  return (
    <div className={styles.itinerary}>
      <div className={styles.itineraryHeader}>
        <div className={styles.itineraryTitle}>Path C · Confirmed</div>
        <div className={styles.itineraryTotal}>$2,010</div>
      </div>
      {[
        { icon: "✈️", label: "Flight", val: `LH 8904 · ${homeCode} → MXP`, sub: "Sep 14 · 8:45 AM · $687" },
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

function ApprovalWatching({ managerEmail }: { managerEmail?: string }) {
  const email = managerEmail || process.env.NEXT_PUBLIC_MANAGER_EMAIL || "your manager";
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>📬</span>
        <div className={styles.confirmTitle}>Watching for Reply</div>
        <div className={styles.confirmBody}>Email sent to {email}. I&#39;ll notify you the moment they respond.</div>
      </div>
      <div className={styles.watchStatus}>
        <div className={styles.watchDot} />
        <span>Monitoring inbox · Last checked just now</span>
      </div>
    </div>
  );
}

function ApprovalPolling({ pollResult, selectedHotel, liveHotels, tripData }: {
  pollResult: ManagerPollResult | null;
  selectedHotel?: number;
  liveHotels?: Hotel[] | null;
  tripData?: TripData | null;
}) {
  const managerEmail = process.env.NEXT_PUBLIC_MANAGER_EMAIL || "your manager";

  if (!pollResult || !pollResult.found) {
    const isNoAuth = pollResult?.noAuth;
    return (
      <div className={styles.actionStack}>
        <div className={styles.confirmCard}>
          <span className={styles.confirmEmoji}>📡</span>
          <div className={styles.confirmTitle}>Scanning Manager&#39;s Inbox</div>
          <div className={styles.confirmBody}>
            {isNoAuth
              ? "Sign in with Google to enable real inbox scanning. Polling will resume once authenticated."
              : `Checking for a reply from ${managerEmail} every 5 seconds…`}
          </div>
        </div>
        <div className={styles.watchStatus}>
          <div className={styles.watchDot} />
          <span style={{ opacity: 0.85 }}>Monitoring inbox · Polling every 5 s</span>
        </div>
        {/* Static hotel comparison while waiting */}
        <HotelComparison selectedHotel={selectedHotel} liveHotels={liveHotels} />
      </div>
    );
  }

  if (pollResult.status === "approved") {
    return (
      <div className={styles.actionStack}>
        <div className={styles.confirmCard}>
          <span className={styles.confirmEmoji}>✅</span>
          <div className={styles.confirmTitle}>Manager Approved!</div>
          <div className={styles.confirmBody}>{pollResult.reason || "Your itinerary has been approved. Moving to the next step…"}</div>
        </div>
        {pollResult.snippet && (
          <div className={styles.watchStatus} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Manager wrote</span>
            <span style={{ fontSize: 12, opacity: 0.8, fontStyle: "italic" }}>&#34;{pollResult.snippet.slice(0, 120)}{pollResult.snippet.length > 120 ? "…" : ""}&#34;</span>
          </div>
        )}
      </div>
    );
  }

  // Rejected — show what changes are needed
  const { changes, reason, flaggedItems } = pollResult;
  return (
    <div className={styles.actionStack}>
      <div className={styles.confirmCard}>
        <span className={styles.confirmEmoji}>🔄</span>
        <div className={styles.confirmTitle}>Revision Requested</div>
        <div className={styles.confirmBody}>{reason || "Manager requested changes to the itinerary."}</div>
      </div>
      {pollResult.snippet && (
        <div className={styles.watchStatus} style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
          <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Manager wrote</span>
          <span style={{ fontSize: 12, opacity: 0.8, fontStyle: "italic" }}>&#34;{pollResult.snippet.slice(0, 160)}{pollResult.snippet.length > 160 ? "…" : ""}&#34;</span>
        </div>
      )}
      {(changes?.hotel || changes?.flight || changes?.dates || changes?.budget) && (
        <div className={styles.complianceList} style={{ marginTop: 8 }}>
          {changes.hotel && (
            <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
              <span className={styles.complianceIcon}>🏨</span>
              <div>
                <div className={styles.complianceTitle}>Hotel Change</div>
                <div className={styles.complianceBody}>{changes.hotel}</div>
              </div>
            </div>
          )}
          {changes.flight && (
            <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
              <span className={styles.complianceIcon}>✈️</span>
              <div>
                <div className={styles.complianceTitle}>Flight Change</div>
                <div className={styles.complianceBody}>{changes.flight}</div>
              </div>
            </div>
          )}
          {changes.dates && (
            <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
              <span className={styles.complianceIcon}>📅</span>
              <div>
                <div className={styles.complianceTitle}>Date Change</div>
                <div className={styles.complianceBody}>{changes.dates}</div>
              </div>
            </div>
          )}
          {changes.budget && (
            <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
              <span className={styles.complianceIcon}>💰</span>
              <div>
                <div className={styles.complianceTitle}>Budget Guidance</div>
                <div className={styles.complianceBody}>{changes.budget}</div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Show hotel comparison if hotel was flagged */}
      {(flaggedItems?.includes("hotel") || !changes?.flight) && (
        <HotelComparison selectedHotel={selectedHotel} liveHotels={liveHotels} />
      )}
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
        <p>Thanks,<br />Lockey</p>
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

function RebookingConfirmed({ tripData }: { tripData?: TripData | null }) {
  const homeCode = tripData?.originCity ? (CITY_TO_AIRPORT[tripData.originCity.toLowerCase()] ?? tripData.originCity.substring(0, 3).toUpperCase()) : "ORD";
  const homeCity = tripData?.originCity || "Chicago";
  return (
    <div className={styles.eticket}>
      <div className={styles.eticketRow}>
        <div className={styles.eticketAirport}><div className={styles.eticketCode}>{homeCode}</div><div className={styles.eticketCity}>{homeCity}</div></div>
        <div className={styles.eticketPlane}>✈</div>
        <div className={[styles.eticketAirport, styles.eticketAirportRight].join(" ")}><div className={styles.eticketCode}>MXP</div><div className={styles.eticketCity}>Milan</div></div>
      </div>
      <div className={styles.eticketGrid}>
        {[["Flight", "LH 9012"], ["Date", "Sep 14, 2025"], ["Departs", "9:00 PM"], ["Seat", "14A (Window)"], ["PNR", "XKMR74"], ["Change fee", "None"]].map(([k, v]) => (
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
        {[["Total spent", "$2,187"], ["Under budget by", "$153"], ["Receipts logged", "7"], ["Days on trip", "5"]].map(([k, v]) => (
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
  { frameNumber: 1, tone: "excited", message: "Hey there! Tell me where you're departing from, where you're headed, your travel dates, and what's bringing you there and I'll get your trip started.", sheetTitle: "Your Trip", options: ["Looks Right", "Adjust"], Visual: TripCard, actionTitle: "Trip Confirmed", ActionVisual: TripConfirmed },
  { frameNumber: 2, tone: "excited", message: "I've scanned nearby airports and a five-day window to find you the best flight options. Take a look!", sheetTitle: "Choose a Flight", options: ["Confirm Flight", "Adjust"], Visual: FlightPicker, actionTitle: "Your E-Ticket", ActionVisual: FlightConfirmed },
  { frameNumber: 3, tone: "excited", message: "I've found hotels near the client office and flagged the preferred vendors for you. Which one feels right?", sheetTitle: "Hotels Near Client Office", options: ["Looks Right", "Adjust"], Visual: DynamicHotelMap, actionTitle: "Hotel Booked", ActionVisual: HotelConfirmed },
  { frameNumber: 4, tone: "empathetic", message: "I ran a compliance check and found two things to sort out. You'll need a Type-C visa, and the hotel requires a quick approval.", sheetTitle: "Compliance Check Complete", options: ["Apply for Visa", "Adjust"], Visual: ComplianceReport, actionTitle: "Visa Application Guide", ActionVisual: VisaGuide },
  { frameNumber: 5, tone: "excited", message: "Here are three ways to bundle your trip. I can optimize for policy compliance, cost savings, or proximity to the office.", sheetTitle: "Choose Your Bundle", options: ["Confirm Bundle", "Adjust"], Visual: BundlePicker, actionTitle: "Itinerary Confirmed", ActionVisual: BundleConfirmed },
  { frameNumber: 6, tone: "neutral", message: "I've drafted the approval email and set up a watch on your manager's thread so nothing slips through.", sheetTitle: "Approval Request Ready", options: ["Send", "Edit Draft"], Visual: ApprovalEmail, actionTitle: "Approval Sent", ActionVisual: ApprovalWatching },
  { frameNumber: 7, tone: "empathetic", message: "I'm scanning your manager's inbox every few seconds. Once I see a reply, I'll tell you exactly what changes are needed so we can move fast.", sheetTitle: "Waiting for Manager Reply", options: ["Resubmit", "Adjust"], Visual: HotelComparison, actionTitle: "Resubmitting to Manager", ActionVisual: ResubmitEmail },
  { frameNumber: 8, tone: "excited", message: "Your trip's approved! I've put together your checklist, visa link, and packing reminders so you're ready to go.", sheetTitle: "Your Travel Checklist", options: ["All Set", "Adjust"], Visual: PrepChecklist, actionTitle: "All Packed!", ActionVisual: TripReady },
  { frameNumber: 9, tone: "neutral", message: "Live mode's on. I'm tracking your gate, the weather, hotel status, and travel conditions in real time.", sheetTitle: "Live Travel Mode", options: ["Looks Right", "Adjust"], Visual: LiveDashboard, actionTitle: "You're Covered", ActionVisual: LiveConfirmed },
  { frameNumber: 10, tone: "urgent", message: "Heads up, there's a storm causing delays. I've already rebooked you on a later flight and notified your hotel.", sheetTitle: "Disruption Handled", options: ["Accept Rebooking", "Adjust"], Visual: FlightRebooking, actionTitle: "New E-Ticket", ActionVisual: RebookingConfirmed },
  { frameNumber: 11, tone: "urgent", message: "The only available rebooking is over budget. I've drafted an emergency exception request to send your manager right now.", sheetTitle: "Emergency Exception", options: ["Send", "Edit Draft"], Visual: ExceptionEmail, actionTitle: "Exception Requested", ActionVisual: ExceptionPending },
  { frameNumber: 12, tone: "excited", message: "Welcome to Milan! Here's the fastest way to your hotel and your daily meal allowance to keep you covered.", sheetTitle: "On-the-Ground Support", options: ["Got It", "Adjust"], Visual: ArrivalSupport, actionTitle: "Transport Booked", ActionVisual: TransportConfirmed },
  { frameNumber: 13, tone: "neutral", message: "Point the camera at your receipt and I'll pull out the merchant name, total, and date automatically.", sheetTitle: "Receipt Captured", options: ["Looks Right", "Adjust"], Visual: ReceiptCapture, actionTitle: "Receipt Logged", ActionVisual: ReceiptSubmitted },
  { frameNumber: 14, tone: "empathetic", message: "Some situations need a real person. Here's the corporate travel desk and the nearest embassy, ready when you need them.", sheetTitle: "Human Support Contacts", options: ["Got It", "Dismiss"], Visual: ContactCards, actionTitle: "Contacts Saved", ActionVisual: ContactsSaved },
  { frameNumber: 15, tone: "excited", message: "Great trip! I've tallied up your final spend and put the expense report together. Ready to wrap it up?", sheetTitle: "Trip Spend Summary", options: ["Archive Trip", "Review"], Visual: SpendSummary, actionTitle: "Trip Archived", ActionVisual: TripArchived },
  { frameNumber: 16, tone: "neutral", message: "Here's a clear breakdown of how your travel data was used, what was shared, and how it's protected.", sheetTitle: "Privacy & Data Summary", options: ["Done", "Adjust"], Visual: PrivacySummary, actionTitle: "Data Protected", ActionVisual: DataCleared },
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
  const allSteps = ROADMAP_PHASES.flatMap((p) => p.steps).filter((step) => isVisibleFrameIndex(step.index));
  const total = allSteps.length;

  return (
    <div className={styles.roadmapWrap}>
      <h2 className={styles.sheetTitle}>Your Journey</h2>
      {ROADMAP_PHASES.map((phase) => (
        <div key={phase.label}>
          <div className={styles.roadmapPhaseLabel}>{phase.label}</div>
          {phase.steps.filter((step) => isVisibleFrameIndex(step.index)).map((step) => {
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
  menuOpen,
  onMenuToggle,
  onResetDemo,
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
  menuOpen: boolean;
  onMenuToggle: () => void;
  onResetDemo: () => void;
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
            <div className={styles.menuWrap}>
              <button aria-label="Open menu" className={styles.menuButton} onClick={onMenuToggle} type="button">
                <MenuIcon />
              </button>
              {menuOpen && (
                <>
                  <div className={styles.menuBackdrop} onClick={onMenuToggle} />
                  <div className={styles.menuPanel}>
                    <button className={[styles.menuItem, styles.menuItemDanger].join(" ")} onClick={onResetDemo} type="button">
                      Reset Demo
                    </button>
                    <button className={styles.menuItem} onClick={() => void signOut({ callbackUrl: "/demo" })} type="button">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
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
                    <span>Start a conversation with Lockey</span>
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
                            <img alt="Lockey" src="/lockey-icon.png" style={{ width: 34, height: 34, objectFit: "contain", display: "block", flexShrink: 0 }} />
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
                        <img alt="Lockey" src="/lockey-icon.png" style={{ width: 34, height: 34, objectFit: "contain", display: "block", flexShrink: 0 }} />
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
                    placeholder="Message Lockey…"
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
                aria-label={isListening ? "Stop recording" : isProcessing ? "Processing…" : "Speak to Lockey"}
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

// ── Login screen (shown inside the phone shell before demo starts) ─

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function LoginScreen() {
  const [loading, setLoading] = React.useState(false);
  return (
    <div className={styles.phone}>
      <section className={styles.shell}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: "0 8px 22px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>✈️</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cc-text-primary, #fff)" }}>Lockey</div>
            <div style={{ fontSize: 13, color: "var(--cc-body, #8a9baa)", marginTop: 4 }}>AI Travel Concierge · Lockton</div>
          </div>
          <button
            onClick={() => { setLoading(true); void signIn("google", { callbackUrl: "/demo" }); }}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff", color: "#1a2530", fontWeight: 600, fontSize: 15,
              border: "none", borderRadius: 14, padding: "13px 28px", cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1, transition: "opacity 150ms",
            }}
          >
            <GoogleIcon />
            {loading ? "Signing in…" : "Sign in with Google"}
          </button>
          <p style={{ fontSize: 11, color: "var(--cc-body, #8a9baa)", textAlign: "center", maxWidth: 200, lineHeight: 1.5 }}>
            Authorizes Gmail access for travel approvals and receipt scanning.
          </p>
        </div>
      </section>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function DemoPage() {
  const visibleFrames = FRAMES.map((frame, index) => ({ ...frame, index })).filter(({ index }) => isVisibleFrameIndex(index));
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
  const [selectedHotel, setSelectedHotel] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState(0);
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  const [liveFlights, setLiveFlights] = useState<DisplayFlightGroup[] | null>(null);
  const [liveFlightResults, setLiveFlightResults] = useState<FlightGroup[] | null>(null);
  const [isFlightSearchLoading, setIsFlightSearchLoading] = useState(false);
  const [flightSearchMessage, setFlightSearchMessage] = useState<string | null>(null);
  const [liveHotels, setLiveHotels] = useState<Hotel[] | null>(null);
  const [isProgressHydrated, setIsProgressHydrated] = useState(false);
  const [approvalPollResult, setApprovalPollResult] = useState<ManagerPollResult | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: { name: string }) => setUserProfile(data))
      .catch(() => { });
  }, []);

  const travelerName = userProfile?.name ?? session?.user?.name ?? undefined;

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
          const savedIndex = Math.max(0, Math.min(FRAMES.length - 1, snapshot.currentIndex));
          setCurrentIndex(getNearestVisibleFrameIndex(savedIndex));
        }
        if (typeof snapshot.overlayReady === "boolean") setOverlayReady(snapshot.overlayReady);
        if (typeof snapshot.overlayDismissed === "boolean") setOverlayDismissed(snapshot.overlayDismissed);
        if (typeof snapshot.tripId === "string" || snapshot.tripId === null) setTripId(snapshot.tripId);
        if (snapshot.tripData) setTripData(snapshot.tripData);
        if (snapshot.frameCompleted) setFrameCompleted(snapshot.frameCompleted);
        if (Array.isArray(snapshot.conversationMessages)) setConversationMessages(snapshot.conversationMessages);
        if (snapshot.knownFields) setKnownFields(snapshot.knownFields);
        if (typeof snapshot.selectedFlight === "number") setSelectedFlight(snapshot.selectedFlight);
        if (typeof snapshot.selectedHotel === "number") setSelectedHotel(snapshot.selectedHotel);
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

    return () => {
      cancelled = true;
    };
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
      selectedHotel,
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
    selectedHotel,
    selectedReturn,
    tripData,
    tripId,
  ]);

  // Speak the frame greeting, then open the sheet once Lockey finishes talking.
  // Frame 0 is special: sheet only opens after Gemini parses the user's speech.
  useEffect(() => {
    if (!isProgressHydrated || status !== "authenticated") return;
    let cancelled = false;

    async function run() {
      const firstName = session?.user?.name?.split(" ")[0];
      const message = currentIndex === 0 && firstName
        ? `Hey, ${firstName}! Tell me where you're headed, your travel dates, and what's bringing you there and I'll get your trip started.`
        : frame.message;
      // Store greeting in chat history (deduplicated)
      if (!greetedFrames.current.has(currentIndex)) {
        greetedFrames.current.add(currentIndex);
        setConversationMessages((prev) => {
          const alreadyHas = prev.some(
            (m) => m.role === "assistant" && m.frameIndex === currentIndex && m.content === message
          );
          if (alreadyHas) return prev;
          return [...prev, { role: "assistant", content: message, frameIndex: currentIndex }];
        });
      }
      await say(message, frame.tone);
      if (!cancelled && currentIndex !== 0) setOverlayReady(true);
    }

    void run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isProgressHydrated, status]);

  // Fetch real flights when entering frame 1 (flight picker)
  useEffect(() => {
    if (!isProgressHydrated) return;
    if (currentIndex !== 1) return;
    const trip = tripData ?? DEMO_DEFAULTS;
    const homeAirport = trip.originCity ? (CITY_TO_AIRPORT[trip.originCity.toLowerCase()] ?? trip.originCity.substring(0, 3).toUpperCase()) : "ORD";
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

  // Fetch real hotels when entering frame 2 (hotel picker)
  useEffect(() => {
    if (!isProgressHydrated) return;
    if (currentIndex !== 2) return;
    const trip = tripData ?? DEMO_DEFAULTS;
    let cancelled = false;

    fetch("/api/hotels/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: trip.city,
        country: trip.country,
        checkIn: trip.departure,
        checkOut: trip.returnDate,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { hotels: Hotel[] }) => {
        if (!cancelled && data.hotels?.length) setLiveHotels(data.hotels.slice(0, 6));
      })
      .catch(() => { }); // silently fall back to DEMO_HOTELS

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isProgressHydrated]);

  // ── Frames 6–7 (index 5–6): Poll Gmail every 5 seconds for manager reply ──────────
  useEffect(() => {
    // Polling is active on both Frame 6 (index 5) and Frame 7 (index 6)
    if (currentIndex !== 5 && currentIndex !== 6) {
      // Reset result when leaving this section so it starts fresh next time
      if (approvalPollResult !== null) setApprovalPollResult(null);
      return;
    }

    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch("/api/gmail/poll-approval");
        if (cancelled) return;
        if (res.ok) {
          const data: ManagerPollResult = await res.json();
          if (!cancelled) {
            setApprovalPollResult(data);
            if (data.found && data.status === "approved") {
              // Auto-advance to Frame 8 (index 7, travel checklist)
              stopSpeaking();
              setOverlayReady(false);
              setOverlayDismissed(false);
              setFrameCompleted((prev) => ({ ...prev, [currentIndex]: true }));
              setCurrentIndex(7);
              return; // stop polling
            }
            if (data.found && data.status === "rejected") {
              // Persist flaggedItems and reason into tripData for downstream frames
              setTripData((prev) => prev ? {
                ...prev,
                approvalThread: {
                  status: "rejected",
                  reason: data.reason ?? null,
                  flaggedItems: data.flaggedItems ?? [],
                },
              } : prev);
              // If on Frame 7 (index 6), send back to Frame 6 (index 5) to show rejection
              // and keep polling there for the next reply (after the user resubmits)
              if (currentIndex === 6) {
                stopSpeaking();
                setOverlayReady(false);
                setOverlayDismissed(false);
                setCurrentIndex(5);
                return; // polling will restart via the new currentIndex trigger
              }
              // Already on index 5 — keep polling for the next email
            }
          }
        }
      } catch {
        // silently ignore poll errors
      }
      // Schedule next poll in 5 seconds
      if (!cancelled) {
        setTimeout(poll, 5000);
      }
    }

    // Kick off first poll immediately
    void poll();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  // Register Web Push Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then((swReg) => {
        console.log("✨ Service Worker registered:", swReg);

        // Helper block so dev can grab the push subscription easily from dev tools
        swReg.pushManager.getSubscription().then(sub => {
          if (!sub) {
            console.log("🔔 No push subscription found. Run `subscribeToPush()` in this console to generate your token for testing.");
            // @ts-ignore
            window.subscribeToPush = async () => {
              const permission = await Notification.requestPermission();
              if (permission === "granted") {
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidKey) return console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set in .env.local!");
                const newSub = await swReg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: vapidKey
                });
                console.log("✅ Push Subscription Object (COPY THIS AND PASTE IN WEBHOOK SIMULATION JSON):", JSON.stringify(newSub));
              } else {
                console.error("Push permission denied");
              }
            }
          } else {
            console.log("✅ Push Subscription Object (COPY THIS AND PASTE IN WEBHOOK SIMULATION JSON):", JSON.stringify(sub));
            // @ts-ignore
            window.subscribeToPush = () => console.log(JSON.stringify(sub));
          }
        });
      }).catch(err => console.error("Service Worker registration failed:", err));
    }
  }, []);

  // Expose an auto-simulator for testing
  useEffect(() => {
    // @ts-ignore
    window.simulateWebhook = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return console.error("Push permission denied");

        const swReg = await navigator.serviceWorker.ready;
        let sub = await swReg.pushManager.getSubscription();
        if (!sub) {
          sub = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          });
        }

        console.log("🚀 Firing simulated webhook to backend...");
        const res = await fetch("/api/webhooks/gmail-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: tripId || "609cabc12345678901234567", // Mock or use active trip
            managerReplyText: "I'm rejecting this trip. The flight LH 8904 is way too expensive.",
            pushSubscription: sub
          })
        });
        const data = await res.json();
        console.log("✅ Webhook processed! Response:", data);
      } catch (e) {
        console.error("Test failed:", e);
      }
    };
  }, [tripId]);

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

      // Auto-stop after sustained silence, with a noise gate so fan
      // hum doesn't count as speech. The mic only "arms" once it
      // detects audio above SPEECH_THRESHOLD, and the silence timer
      // only triggers when levels drop below SILENCE_THRESHOLD.
      const SILENCE_THRESHOLD = 30;   // fan noise sits ~5-20
      const SPEECH_THRESHOLD = 35;   // must exceed this to arm
      const SILENCE_MS = 2200; // ms of quiet before auto-stop
      let silenceStart: number | null = null;
      let speechDetected = false;

      silenceTimerRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state !== "recording") {
          clearInterval(silenceTimerRef.current!);
          silenceTimerRef.current = null;
          return;
        }
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;

        // Noise gate: don't start silence countdown until real
        // speech has been detected at least once.
        if (!speechDetected) {
          if (avg >= SPEECH_THRESHOLD) speechDetected = true;
          return; // keep waiting for speech
        }

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
      } else if (currentIndex === 5) {
        // Email send doesn't need a DB trip — run it unconditionally, patch if we have a tripId
        await executeFrameAction(5, tripId ?? "_no_trip_", {
          flight: selectedFlight,
          hotel: selectedHotel,
          selectedReturn,
          bundle: selectedBundle,
          liveFlightGroups: liveFlightResults,
          liveDisplayFlights: liveFlights,
          liveHotels,
          tripData,
          skipPatch: !tripId,
        });
      } else if (tripId) {
        await executeFrameAction(currentIndex, tripId, {
          flight: selectedFlight,
          hotel: selectedHotel,
          selectedReturn,
          bundle: selectedBundle,
          liveFlightGroups: liveFlightResults,
          liveDisplayFlights: liveFlights,
          liveHotels,
          tripData,
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
  function handleResetDemo() {
    window.localStorage.removeItem(DEMO_PROGRESS_STORAGE_KEY);
    window.location.reload();
  }

  function handleFrameSelect(nextIndex: number) {
    if (isProcessing || nextIndex === currentIndex || !isVisibleFrameIndex(nextIndex)) return;
    stopSpeaking();
    setOverlayReady(false);
    setOverlayDismissed(false);
    setCurrentIndex(nextIndex);
  }

  if (status === "unauthenticated") {
    return (
      <main className={styles.page}>
        <LoginScreen />
      </main>
    );
  }

  if (!isProgressHydrated || status === "loading") {
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
      case 0: return <TripCard travelerName={travelerName} tripData={tripData} />;
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
        return (
          <FlightPickerV2
            groups={liveFlights}
            onOutboundChange={setSelectedFlight}
            onReturnChange={setSelectedReturn}
            returnValue={selectedReturn}
            tripData={tripData}
            value={selectedFlight}
          />
        );
      case 2: return <DynamicHotelMap hotels={liveHotels || []} onChange={setSelectedHotel} value={selectedHotel} />;
      case 4: return <BundlePicker value={selectedBundle} onChange={setSelectedBundle} />;
      case 5: return <ApprovalEmail tripData={tripData} selectedHotel={selectedHotel} liveHotels={liveHotels} selectedFlight={selectedFlight} />;
      case 6:
        return (
          <ApprovalPolling
            pollResult={approvalPollResult}
            selectedHotel={selectedHotel}
            liveHotels={liveHotels}
            tripData={tripData}
          />
        );
      default: { const V = frame.Visual as React.ComponentType<any>; return <V tripData={tripData} selectedFlight={selectedFlight} selectedHotel={selectedHotel} selectedBundle={selectedBundle} liveHotels={liveHotels} liveFlights={liveFlights} liveFlightResults={liveFlightResults} />; }
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
        menuOpen={menuOpen}
        onChatInputChange={setChatInput}
        onChatSend={() => void handleChatSend()}
        onChatToggle={handleChatToggle}
        onEllipsisOpen={handleEllipsisOpen}
        onMenuToggle={() => setMenuOpen((v) => !v)}
        onMicClick={handleMicClick}
        onOpenSheet={handleOpenSheet}
        onResetDemo={handleResetDemo}
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
        <div className={styles.frameNavGrid}>
          {visibleFrames.map(({ frameNumber, index, sheetTitle }) => {
            const isCurrent = currentIndex === index;
            const isDone = !!frameCompleted[index];

            return (
              <button
                key={frameNumber}
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  styles.frameNavButton,
                  isCurrent ? styles.frameNavButtonCurrent : "",
                  isDone ? styles.frameNavButtonDone : "",
                ].join(" ")}
                disabled={isProcessing}
                onClick={() => handleFrameSelect(index)}
                title={sheetTitle}
                type="button"
              >
                <span className={styles.frameNavNumber}>{frameNumber}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
