"use client";

import { useState } from "react";
import { useMascot } from "@/hooks/useMascot";

export interface AlternativeFlight {
  flightNumber: string;
  carrier: string;
  departureTime: string;
  arrivalTime: string;
  priceUsd: number;
  origin: string;
  destination: string;
}

export interface ExceptionDraft {
  subject: string;
  body: string;
}

interface CrisisAlertProps {
  tripId: string;
  delayMinutes: number;
  isCancelled: boolean;
  alternativeFlight: AlternativeFlight | null;
  isOverBudget: boolean;
  exceptionDraft: ExceptionDraft | null;
  onRebooked?: () => void;
}

export function CrisisAlert({
  tripId,
  delayMinutes,
  isCancelled,
  alternativeFlight,
  isOverBudget,
  exceptionDraft,
  onRebooked,
}: CrisisAlertProps) {
  const mascot = useMascot();
  const [sendingException, setSendingException] = useState(false);
  const [exceptionSent, setExceptionSent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirmRebook = () => {
    setConfirmed(true);
    mascot.say("Great, I've noted the rebooking. Check with the airline desk or app to complete the change.", "empathetic");
    onRebooked?.();
  };

  const handleSendException = async () => {
    if (!exceptionDraft) return;
    setSendingException(true);
    try {
      await fetch(`/api/trips/${tripId}/exception`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: exceptionDraft.subject, body: exceptionDraft.body }),
      });
      setExceptionSent(true);
      mascot.say("Exception request sent to your manager. I'll let you know as soon as they respond.", "empathetic");
    } catch {
      // silently fail — email draft is still visible
    } finally {
      setSendingException(false);
    }
  };

  const disruptionLabel = isCancelled ? "Flight Cancelled" : `${delayMinutes}-Minute Delay`;
  const disruptionDesc = isCancelled
    ? "Your flight has been cancelled. Immediate rebooking required."
    : `Your flight is delayed by ${delayMinutes} minutes — this exceeds your connection window of 45 minutes.`;

  return (
    <div className="fixed inset-0 z-50 bg-red-950 text-white flex flex-col items-center justify-start overflow-y-auto p-6 gap-6">
      {/* Header */}
      <div className="w-full max-w-xl text-center pt-4">
        <div className="text-5xl mb-2">⚠️</div>
        <h1 className="text-3xl font-bold text-red-300">{disruptionLabel}</h1>
        <p className="mt-2 text-red-200 text-sm">{disruptionDesc}</p>
      </div>

      {/* Alternative flight card */}
      {alternativeFlight && (
        <div className="w-full max-w-xl bg-red-900 border border-red-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Alternative Found</h2>
          <div className="flex justify-between items-center text-sm text-red-200 mb-1">
            <span>{alternativeFlight.carrier} · {alternativeFlight.flightNumber}</span>
            <span className="text-white font-semibold">${alternativeFlight.priceUsd}</span>
          </div>
          <div className="text-xs text-red-300">
            {alternativeFlight.origin} → {alternativeFlight.destination}
          </div>
          <div className="text-xs text-red-300">
            Departs: {new Date(alternativeFlight.departureTime).toLocaleString()} · Arrives: {new Date(alternativeFlight.arrivalTime).toLocaleString()}
          </div>

          {isOverBudget && (
            <div className="mt-3 text-xs text-yellow-300 bg-yellow-900/40 rounded px-3 py-2">
              This option exceeds your travel budget. An exception request has been drafted below.
            </div>
          )}

          {!confirmed ? (
            <button
              onClick={handleConfirmRebook}
              className="mt-4 w-full bg-white text-red-900 font-semibold py-2 rounded-lg hover:bg-red-100 transition-colors"
            >
              Confirm Rebooking
            </button>
          ) : (
            <p className="mt-4 text-center text-green-300 text-sm font-medium">✓ Rebooking confirmed</p>
          )}
        </div>
      )}

      {/* No alternative — escalation */}
      {!alternativeFlight && (
        <div className="w-full max-w-xl bg-red-900 border border-red-700 rounded-xl p-5 text-center">
          <p className="text-red-200 text-sm mb-3">No automated alternative available. Please contact the airline directly.</p>
          <div className="text-white font-semibold">Airline support: contact the gate desk or airline app</div>
        </div>
      )}

      {/* Exception request */}
      {isOverBudget && exceptionDraft && (
        <div className="w-full max-w-xl bg-yellow-950 border border-yellow-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-yellow-200 mb-3">Exception Request Draft</h2>
          <div className="text-xs text-yellow-300 mb-1 font-medium">Subject: {exceptionDraft.subject}</div>
          <pre className="text-xs text-yellow-100 whitespace-pre-wrap leading-relaxed bg-yellow-900/30 rounded p-3 max-h-40 overflow-y-auto">
            {exceptionDraft.body}
          </pre>

          {!exceptionSent ? (
            <button
              onClick={handleSendException}
              disabled={sendingException}
              className="mt-4 w-full bg-yellow-500 text-yellow-950 font-semibold py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {sendingException ? "Sending…" : "Send to Manager"}
            </button>
          ) : (
            <p className="mt-4 text-center text-green-300 text-sm font-medium">✓ Exception request sent</p>
          )}
        </div>
      )}
    </div>
  );
}
