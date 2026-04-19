// ============================================================
// LAYOUT: Root Layout
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Wraps every page with the NextAuth SessionProvider
//   and the global persistent Mascot component. The Mascot is
//   rendered here so it persists across route changes without
//   re-mounting or losing speech state.
// ============================================================

import type { Metadata } from "next";
import { Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider"
// TODO: import { Mascot } from "@/components/mascot/Mascot"

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Travel Concierge | Lockton",
  description: "AI-powered corporate travel assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          {/* TODO: <Mascot /> ← persistent across all pages */}
        </AuthProvider>
      </body>
    </html>
  );
}
