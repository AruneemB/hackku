// ============================================================
// COMPONENT: Mascot
// OWNER: Track A (Frontend & UX)
// FRAME: All frames — persistent across the app
// DESCRIPTION: Root mascot component. Renders the placeholder
//   image + SpeechBubble overlay. Position is fixed bottom-left
//   so it persists as Kelli navigates pages. When isSpeaking,
//   a subtle bounce animation plays on the image.
//
// PROPS:
//   Uses useMascot hook (no props needed — hook provides state)
//
// VISUAL LAYOUT:
//   [Mascot Image] ← bottom-left, fixed
//   [SpeechBubble] ← floats above the image
//   [ToneIndicator] ← small badge on mascot (color = tone)
// ============================================================

"use client";

import Image from "next/image";
import { useMascot } from "@/hooks/useMascot";

/**
 * COMPONENT: Mascot
 * DESCRIPTION: Root mascot component. Renders the placeholder
 *   image + SpeechBubble overlay. 
 */
export function Mascot() {
  const { speech, tone, isSpeaking } = useMascot();

  return (
    <div className="flex flex-col items-center">
      {speech && (
        <div className="mb-4 p-4 bg-white rounded-2xl shadow-lg border-2 border-blue-100 relative max-w-xs">
          <p className="text-gray-800 text-sm font-medium leading-relaxed italic">
            "{speech}"
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-blue-100 rotate-45"></div>
        </div>
      )}
      
      <div className={`relative ${isSpeaking ? "animate-bounce" : ""}`}>
        <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl shadow-xl overflow-hidden border-4 border-white">
          {/* Placeholder for mascot image */}
          {tone === "excited" ? "😆" : tone === "empathetic" ? "🥺" : tone === "urgent" ? "🚨" : "🙂"}
        </div>
        
        {/* Tone Indicator */}
        <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm ${
          tone === "excited" ? "bg-green-400" : 
          tone === "urgent" ? "bg-red-500" : 
          tone === "empathetic" ? "bg-purple-400" : 
          "bg-blue-400"
        }`}></div>
      </div>
      
      <div className="mt-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Kelli's Assistant
        </span>
      </div>
    </div>
  );
}
