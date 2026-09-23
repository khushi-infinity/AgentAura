import type { Metadata } from "next";
import { Press_Start_2P, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-press-start",
});

// The Stitch "Pixelated Multi-Page App" screens set Plus Jakarta Sans as the
// UI typeface — self-hosted via next/font so there is no runtime Google request.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "AgentAura — Build a company. Let agents run it.",
  description:
    "Company operating system for the agent economy: give AgentAura a goal, agents plan, discover and hire external help on OKX.AI, verify results and settle payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${jakarta.variable}`}>
      <body>
        {/* The navigation rail, top status bar, ambient scenery and bottom
            status strip live in AppShell. It was defined but never mounted,
            which is why every page rendered bare with no chrome. */}
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
