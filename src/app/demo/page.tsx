"use client";

import { useEffect, useRef, useState } from "react";
import { Ellipsis, Pencil } from "lucide-react";
import { Mascot } from "@/components/mascot/Mascot";
import { useMascot } from "@/hooks/useMascot";
import styles from "./page.module.css";

type Tone = "neutral" | "excited" | "empathetic" | "urgent";

type DemoFrame = {
  tone: Tone;
  message: string;
  sheetTitle: string;
  sheetSubtitle: string;
  techStack: string[];
  options: [string, string];
  Visual: React.FC;
};

// ── Visual components ──────────────────────────────────────────

function TripCard() {
  return (
    <div className={styles.tripCard}>
      <div className={styles.tripDestination}>
        <span className={styles.tripFlag}>🇮🇹</span>
        <div>
          <div className={styles.tripCity}>Milan, Italy</div>
          <div className={styles.tripDates}>Sep 14 – Sep 19, 2025 · 5 nights</div>
        </div>
      </div>
      <div className={styles.alertBox}>
        <span className={styles.alertIcon}>⚠️</span>
        <div>
          <div className={styles.alertTitle}>Passport expires Jan 2025</div>
          <div className={styles.alertBody}>Within 6 months of travel — renewal recommended after this trip</div>
        </div>
      </div>
      <div className={styles.infoGrid}>
        {[
          ["Traveler", "Kelli Monroe"],
          ["Department", "Risk Management"],
          ["Purpose", "Client on-site meeting"],
          ["Document", "Trip #TRP-20250914"],
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

function FlightPicker() {
  const [sel, setSel] = useState(0);
  const flights = [
    { code: "LH 8904", route: "ORD → MXP", dep: "8:45 AM", arr: "11:20 AM+1", dur: "9h 35m", stops: "Nonstop", price: "$687", tag: "Best pick" },
    { code: "LX 0117", route: "ORD → ZRH → MXP", dep: "6:15 AM", arr: "2:50 PM+1", dur: "10h 35m", stops: "1 stop", price: "$543", tag: "" },
    { code: "AF 0264", route: "ORD → BGY", dep: "10:30 AM", arr: "12:15 PM+1", dur: "8h 45m", stops: "Nonstop", price: "$412", tag: "Cheapest" },
  ];
  return (
    <div className={styles.cards}>
      {flights.map((f, i) => (
        <button className={[styles.card, sel === i ? styles.cardSelected : ""].join(" ")} key={f.code} onClick={() => setSel(i)} type="button">
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>{f.code}</span>
            {f.tag && <span className={styles.cardTag}>{f.tag}</span>}
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardTime}>{f.dep} → {f.arr}</span>
            <span className={styles.cardPrice}>{f.price}</span>
          </div>
          <span className={styles.cardMeta}>{f.route} · {f.dur} · {f.stops}</span>
        </button>
      ))}
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
          <div className={styles.complianceBody}>US citizens must apply ≥ 15 days before departure · italyvisa.com</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceWarn].join(" ")}>
        <span className={styles.complianceIcon}>⚠️</span>
        <div>
          <div className={styles.complianceTitle}>Hotel Exception Needed</div>
          <div className={styles.complianceBody}>Marriott Scala at $247/night exceeds the $200 Milan cap · manager sign-off required</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Flight within budget</div>
          <div className={styles.complianceBody}>LH 8904 at $687 · approved cap is $800 · nonstop, MXP</div>
        </div>
      </div>
      <div className={[styles.complianceItem, styles.complianceOk].join(" ")}>
        <span className={styles.complianceIcon}>✓</span>
        <div>
          <div className={styles.complianceTitle}>Travel dates policy-compliant</div>
          <div className={styles.complianceBody}>Sep 14–19 · 5-night stay · within 10-day maximum</div>
        </div>
      </div>
    </div>
  );
}

function ApprovalEmail() {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className={styles.sentBanner}>
        <span>✓</span>
        <span>Sent to mgr.sarah@lockton.com</span>
      </div>
    );
  }
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Travel Approval — Milan, Sep 14–19</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p>I&#39;m requesting approval for a business trip to <strong>Milan, Italy, Sep 14–19, 2025</strong> for an on-site client meeting.</p>
        <p><strong>Flight:</strong> LH 8904, ORD → MXP · $687 (nonstop)<br />
        <strong>Hotel:</strong> Marriott Scala · $247/night × 5 = $1,235<br />
        <strong>Note:</strong> Hotel is $47 over the $200 cap. It is 0.4 km from the client office — the closest preferred vendor.</p>
        <p>Total estimated: $2,010. Please let me know if you have any questions.</p>
        <p>Thanks,<br />Kelli</p>
      </div>
      <button className={styles.emailSend} onClick={() => setSent(true)} type="button">
        Send Request
      </button>
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
        <div className={styles.compareMeta}>0.4 km from office</div>
        <div className={styles.compareReason}>Saves $290 total · fully compliant</div>
      </div>
    </div>
  );
}

function PrepChecklist() {
  const [done, setDone] = useState<Set<number>>(new Set());
  const items = [
    { text: "Apply for Type-C visa — italyvisa.com", urgent: true },
    { text: "Passport expires Jan 2025 — renew after trip", urgent: true },
    { text: "Pack for 24 °C with chance of rain, days 2–4" },
    { text: "Marriott Scala · Via della Spiga 31 · Check-in Sep 14, 3:00 PM" },
    { text: "Confirm travel insurance coverage" },
  ];
  function toggle(i: number) {
    setDone(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
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
        { icon: "✈️", title: "LH 8904 · Gate B22", sub: "Boards 8:15 AM · Departs 8:45 AM", badge: "On time", ok: true },
        { icon: "🌤️", title: "Milan · 24 °C", sub: "Partly cloudy · Low 18 °C tonight", badge: "", ok: false },
        { icon: "🏨", title: "Marriott Scala · Room 412", sub: "Check-in ready from 3:00 PM", badge: "Ready", ok: true },
        { icon: "🚗", title: "Traffic to MXP · 32 min", sub: "Leave by 7:00 AM to make your gate", badge: "", ok: false },
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
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className={styles.sentBanner}>
        <span>✓</span>
        <span>Exception request sent to mgr.sarah@lockton.com</span>
      </div>
    );
  }
  return (
    <div className={styles.emailDraft}>
      <div className={styles.emailField}><span className={styles.emailKey}>To</span><span className={styles.emailVal}>mgr.sarah@lockton.com</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Priority</span><span className={[styles.emailVal, styles.emailUrgent].join(" ")}>HIGH — Action required</span></div>
      <div className={styles.emailField}><span className={styles.emailKey}>Subject</span><span className={styles.emailVal}>Emergency Exception — Milan Rebooking</span></div>
      <div className={styles.emailBody}>
        <p>Hi Sarah,</p>
        <p><strong>LH 8904 was cancelled due to a thunderstorm</strong> at O&#39;Hare. The only available rebooking is LH 9012 at <strong>$1,067</strong>, which is $380 over the approved $687 budget.</p>
        <p>This is a carrier-initiated cancellation (force majeure). I&#39;m requesting an emergency exception to proceed immediately — my hotel hold expires in 2 hours.</p>
        <p>Kelli</p>
      </div>
      <button className={styles.emailSend} onClick={() => setSent(true)} type="button">
        Send Exception Request
      </button>
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
        <span className={styles.receiptTag}>✓ Stored as Decimal128</span>
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
          <div className={styles.contactDetail}>Mon–Fri · 8:00 AM – 5:00 PM</div>
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
        { icon: "📍", label: "Location tracking", detail: "Active Sep 14–19 only", status: "Stopped" },
        { icon: "💳", label: "Financial data", detail: "Card numbers sanitized before storage", status: "Done" },
        { icon: "🔑", label: "OAuth tokens", detail: "Encrypted at rest in MongoDB Atlas", status: "Secured" },
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

function BundlePicker() {
  const [sel, setSel] = useState<number | null>(null);
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

// ── Frame data ─────────────────────────────────────────────────

const FRAMES: DemoFrame[] = [
  {
    tone: "neutral",
    message: "Hi Kelli. Tell me where you are going and the dates, and I will start a draft trip.",
    sheetTitle: "Milan, Italy · Sep 14–19",
    sheetSubtitle: "Identity & intent captured",
    techStack: ["MongoDB Atlas", "Gemini", "ElevenLabs"],
    options: ["Looks right", "Adjust"],
    Visual: TripCard,
  },
  {
    tone: "neutral",
    message: "I am searching nearby airports, a five-day window, and Saturday-night savings.",
    sheetTitle: "Choose a flight",
    sheetSubtitle: "Automated flight algorithm",
    techStack: ["Atlas Search", "Gemini"],
    options: ["Confirm flight", "Adjust"],
    Visual: FlightPicker,
  },
  {
    tone: "neutral",
    message: "I found nearby hotels and highlighted preferred vendors close to the client office.",
    sheetTitle: "Hotels near client office",
    sheetSubtitle: "Proximity-based hotel search",
    techStack: ["MongoDB GeoJSON", "Atlas"],
    options: ["Looks right", "Adjust"],
    Visual: HotelMap,
  },
  {
    tone: "empathetic",
    message: "I checked the rules. You need a Type-C visa and this hotel needs a quick sign-off.",
    sheetTitle: "Compliance check complete",
    sheetSubtitle: "Policy & visa verification",
    techStack: ["Atlas Vector Search", "Gemini"],
    options: ["Looks right", "Adjust"],
    Visual: ComplianceReport,
  },
  {
    tone: "excited",
    message: "Here are three bundle paths. I can optimize for policy, savings, or proximity.",
    sheetTitle: "Choose your bundle",
    sheetSubtitle: "Tradeoff presentation",
    techStack: ["Gemini", "Atlas"],
    options: ["Confirm bundle", "Adjust"],
    Visual: BundlePicker,
  },
  {
    tone: "neutral",
    message: "I drafted the approval email and started watching the manager thread.",
    sheetTitle: "Approval request ready",
    sheetSubtitle: "Invisible approval handshake",
    techStack: ["Google OAuth", "Gmail API", "Atlas Triggers"],
    options: ["Sent!", "Edit draft"],
    Visual: ApprovalEmail,
  },
  {
    tone: "empathetic",
    message: "The manager rejected the hotel cost. Here is a compliant alternative ready to resubmit.",
    sheetTitle: "Recovery option prepared",
    sheetSubtitle: "Rejection detected & resolved",
    techStack: ["Atlas Triggers", "Gemini", "ElevenLabs"],
    options: ["Resubmit", "Adjust"],
    Visual: HotelComparison,
  },
  {
    tone: "excited",
    message: "Your trip is approved. I generated the checklist, visa link, and packing reminders.",
    sheetTitle: "Your travel checklist",
    sheetSubtitle: "Automated traveler prep",
    techStack: ["Gemini", "MongoDB"],
    options: ["All set", "Adjust"],
    Visual: PrepChecklist,
  },
  {
    tone: "neutral",
    message: "Live mode is active. Your gate, weather, hotel, and travel conditions are updating.",
    sheetTitle: "Live travel mode",
    sheetSubtitle: "TimeSeries situational dashboard",
    techStack: ["MongoDB TimeSeries", "ElevenLabs"],
    options: ["Looks right", "Adjust"],
    Visual: LiveDashboard,
  },
  {
    tone: "urgent",
    message: "I detected a delay. I already found a later flight and notified your hotel.",
    sheetTitle: "Disruption handled",
    sheetSubtitle: "Proactive crisis intervention",
    techStack: ["ElevenLabs", "Atlas Triggers", "Gemini"],
    options: ["Accept rebooking", "Adjust"],
    Visual: FlightRebooking,
  },
  {
    tone: "urgent",
    message: "The only rebooking is over budget. I drafted an emergency exception for your manager.",
    sheetTitle: "Emergency exception",
    sheetSubtitle: "Over-budget escalation",
    techStack: ["Gemini", "Atlas", "Gmail API"],
    options: ["Sent!", "Edit draft"],
    Visual: ExceptionEmail,
  },
  {
    tone: "neutral",
    message: "You have arrived. Here is the fastest route to the hotel and your daily meal allowance.",
    sheetTitle: "On-the-ground support",
    sheetSubtitle: "Spatial & allowance guidance",
    techStack: ["MongoDB GeoJSON", "Gemini"],
    options: ["Got it", "Adjust"],
    Visual: ArrivalSupport,
  },
  {
    tone: "neutral",
    message: "Hold the receipt to the camera. I will extract the merchant, total, and date.",
    sheetTitle: "Receipt captured",
    sheetSubtitle: "Multimodal receipt harvesting",
    techStack: ["Gemini Vision", "MongoDB Decimal128"],
    options: ["Looks right", "Adjust"],
    Visual: ReceiptCapture,
  },
  {
    tone: "urgent",
    message: "This requires a human touch. Here is the travel desk and the nearest embassy.",
    sheetTitle: "Human support contacts",
    sheetSubtitle: "AI escalation & safety net",
    techStack: ["MongoDB", "ElevenLabs"],
    options: ["Got it", "Dismiss"],
    Visual: ContactCards,
  },
  {
    tone: "excited",
    message: "I summarized your final spend and drafted the expense report. This trip is ready to archive.",
    sheetTitle: "Trip spend summary",
    sheetSubtitle: "Post-trip closure",
    techStack: ["Google OAuth", "Gmail API", "MongoDB"],
    options: ["Archive trip", "Review"],
    Visual: SpendSummary,
  },
  {
    tone: "neutral",
    message: "Here is exactly how your travel data was used, limited, and protected.",
    sheetTitle: "Privacy & data summary",
    sheetSubtitle: "Transparency screen",
    techStack: ["MongoDB Atlas", "Google OAuth"],
    options: ["Done", "Review again"],
    Visual: PrivacySummary,
  },
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

// ── Phone shell ────────────────────────────────────────────────

function PhoneShell({
  sheetContent,
  sheetOpen,
  onSheetClose,
  showEllipsis,
  onEllipsisOpen,
}: {
  sheetContent: React.ReactNode;
  sheetOpen: boolean;
  onSheetClose: () => void;
  showEllipsis: boolean;
  onEllipsisOpen: () => void;
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
            <button aria-label="Speech mode" className={[styles.iconButton, styles.primaryButton, styles.buttonActive].join(" ")} type="button">
              <MicIcon />
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
          <div className={styles.sheetScroll}>{sheetContent}</div>
        </div>
      </section>
    </div>
  );
}

// ── Sheet body ─────────────────────────────────────────────────

function SheetBody({ frame, onSelect }: { frame: DemoFrame; onSelect: (v: string) => void }) {
  return (
    <div className={styles.sheetContent}>
      <div className={styles.sheetHeader}>
        <p className={styles.sheetSubtitle}>{frame.sheetSubtitle}</p>
        <h2 className={styles.sheetTitle}>{frame.sheetTitle}</h2>
      </div>
      <frame.Visual />
      <div className={styles.techStack}>
        {frame.techStack.map(tech => <span className={styles.techBadge} key={tech}>{tech}</span>)}
      </div>
      <div className={styles.sheetActions}>
        <button className={[styles.actionButton, styles.primaryAction].join(" ")} onClick={() => onSelect(frame.options[0])} type="button">{frame.options[0]}</button>
        <button className={[styles.actionButton, styles.secondaryAction].join(" ")} onClick={() => onSelect(frame.options[1])} type="button">{frame.options[1]}</button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function DemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlayReady, setOverlayReady] = useState(false);
  const [overlayDismissed, setOverlayDismissed] = useState(false);
  const { say, stopSpeaking } = useMascot();
  const frame = FRAMES[currentIndex];
  const sheetOpen = overlayReady && !overlayDismissed;
  const showEllipsis = overlayReady && overlayDismissed;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    async function runFrame() {
      await say(frame.message, frame.tone);
      if (cancelled) return;
      timeoutId = window.setTimeout(() => { if (!cancelled) setOverlayReady(true); }, 1000);
    }
    void runFrame();
    return () => { cancelled = true; if (timeoutId) window.clearTimeout(timeoutId); };
  }, [currentIndex, frame.message, frame.tone, say]);

  function handleSelect() { setOverlayDismissed(true); }
  function handleEllipsisOpen() { setOverlayDismissed(false); }
  function handleBack() { stopSpeaking(); setOverlayReady(false); setOverlayDismissed(false); setCurrentIndex(v => Math.max(0, v - 1)); }
  function handleNext() { stopSpeaking(); setOverlayReady(false); setOverlayDismissed(false); setCurrentIndex(v => Math.min(FRAMES.length - 1, v + 1)); }

  return (
    <main className={styles.page}>
      <PhoneShell
        onEllipsisOpen={handleEllipsisOpen}
        onSheetClose={() => setOverlayDismissed(true)}
        sheetContent={<SheetBody frame={frame} onSelect={handleSelect} />}
        sheetOpen={sheetOpen}
        showEllipsis={showEllipsis}
      />
      <div className={styles.nav}>
        <button className={[styles.navButton, styles.navButtonSecondary].join(" ")} disabled={currentIndex === 0} onClick={handleBack} type="button">Back</button>
        <button className={[styles.navButton, styles.navButtonPrimary].join(" ")} disabled={currentIndex === FRAMES.length - 1} onClick={handleNext} type="button">Next</button>
      </div>
    </main>
  );
}
