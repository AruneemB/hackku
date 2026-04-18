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

// TODO: "use client"
// TODO: import Image from "next/image"
// TODO: import { useMascot } from "@/hooks/useMascot"
// TODO: import { SpeechBubble } from "./SpeechBubble"
// TODO: import { ToneIndicator } from "./ToneIndicator"

// TODO: export function Mascot() {
//   // const { speech, tone, isSpeaking } = useMascot()
//   // return (
//   //   <div className="fixed bottom-4 left-4 z-50 flex flex-col items-center">
//   //     {speech && <SpeechBubble text={speech} />}
//   //     <div className={isSpeaking ? "animate-bounce" : ""}>
//   //       <Image src="/mascot/mascot-placeholder.png" alt="Travel Mascot" width={120} height={120} />
//   //       <ToneIndicator tone={tone} />
//   //     </div>
//   //   </div>
//   // )
// }
