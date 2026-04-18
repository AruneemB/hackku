// ============================================================
// LAYOUT: Root Layout
// OWNER: Track A (Frontend & UX)
// DESCRIPTION: Wraps every page with the NextAuth SessionProvider
//   and the global persistent Mascot component. The Mascot is
//   rendered here so it persists across route changes without
//   re-mounting or losing speech state.
// ============================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider"
// TODO: import { Mascot } from "@/components/mascot/Mascot"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Travel Concierge | Lockton",
  description: "AI-powered corporate travel assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
          {/* TODO: <Mascot /> ← persistent across all pages */}
        </AuthProvider>
      </body>
    </html>
  );
}
