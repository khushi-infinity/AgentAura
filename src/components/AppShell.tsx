"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

// Shared UI shell (spec §7): left navigation in dark forest teal, top
// status bar with date/session + wallet balance, page content on cream.

const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/missions", label: "Missions", icon: "🎯" },
  { href: "/agents", label: "Agents", icon: "🤖" },
  { href: "/marketplace", label: "Marketplace", icon: "🛒" },
  { href: "/memory", label: "Company Memory", icon: "🧠" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/wallet", label: "Wallet", icon: "💰" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/onboarding" || pathname === "/create";
  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-forest">
      {/* Left navigation */}
      <aside className="w-56 shrink-0 border-r-2 border-[#0a1613] bg-forest-2 flex flex-col sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 px-4 py-5 border-b-2 border-[#0a1613]">
          <span className="text-2xl" aria-hidden>
            🌲
          </span>
          <div>
            <div className="font-pixel text-cream text-xs">AgentAura</div>
            <div className="pixel-label text-leaf-bright mt-1">Build · Delegate · Run</div>
          </div>
        </Link>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto pixel-scroll">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  active
                    ? "bg-leaf text-cream font-semibold"
                    : "text-cream/75 hover:bg-forest-3 hover:text-cream"
                }`}
              >
                <span aria-hidden>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t-2 border-[#0a1613]">
          <Link
            href="/create"
            className="pixel-btn pixel-btn-gold w-full !text-[9px] !px-2 !py-2.5"
          >
            + New Company
          </Link>
          <div className="flex items-center gap-2 mt-3 text-cream/60 text-xs">
            <span className="w-6 h-6 rounded-sm bg-forest-3 border border-[#0a1613] flex items-center justify-center" aria-hidden>
              👤
            </span>
            Founder
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopStatusBar />
        <main className="flex-1 min-w-0">{children}</main>
        <footer className="bg-forest-2 border-t-2 border-[#0a1613] px-6 py-2.5 flex items-center gap-4 text-[11px] text-cream/60">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 ${true ? "bg-leaf-bright animate-pulse-soft" : "bg-danger"}`} />
            OKX AI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gold" />
            X Layer Testnet
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-sky" />
            Agentic Wallet
          </span>
          <span className="ml-auto opacity-60">Build a company. Let agents run it.</span>
        </footer>
      </div>
    </div>
  );
}

function TopStatusBar() {
  const [now, setNow] = useState<string>("--:--");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="bg-forest border-b-2 border-[#0a1613] px-6 py-2.5 flex items-center gap-4 text-xs text-cream/80">
      <span>Day {new Date().getDate()} · Session</span>
      <span className="font-pixel text-[9px] text-leaf-bright">{now}</span>
      <span className="ml-auto flex items-center gap-2">
        <span className="pixel-label bg-forest-3 text-leaf-bright border border-leaf px-1.5 py-1 rounded-sm">
          4.33 USD₮0
        </span>
        <span className="w-6 h-6 rounded-sm bg-forest-3 border border-[#0a1613] flex items-center justify-center" aria-hidden>
          👤
        </span>
      </span>
    </header>
  );
}

export function Hero({
  title,
  subtitle,
  art,
}: {
  title: string;
  subtitle: string;
  art: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b-2 border-[#0a1613] bg-gradient-to-b from-forest-2 to-forest">
      <div className="absolute inset-0 opacity-60 pointer-events-none" aria-hidden>
        {art}
      </div>
      <div className="relative px-6 py-6">
        <h1 className="font-pixel text-cream text-lg leading-relaxed drop-shadow-[2px_2px_0_rgba(0,0,0,0.45)]">
          {title}
        </h1>
        <p className="text-cream/70 text-sm mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

/** Pure-CSS/SVG environmental pixel-art strip (no binary assets needed). */
export function PixelScenery({ variant = "forest" }: { variant?: "forest" | "mountain" | "lake" }) {
  if (variant === "mountain") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice">
        <rect width="400" height="120" fill="#14332b" />
        <polygon points="0,120 90,30 150,120" fill="#1b4034" />
        <polygon points="90,30 120,75 150,120" fill="#f7f1e3" opacity="0.85" />
        <polygon points="120,120 210,18 300,120" fill="#2e7d4f" />
        <polygon points="210,18 245,70 300,120" fill="#f7f1e3" opacity="0.8" />
        <polygon points="260,120 340,42 400,120" fill="#1b4034" />
        <rect y="112" width="400" height="8" fill="#0e1f1a" />
        <circle cx="352" cy="24" r="10" fill="#d9a441" opacity="0.9" />
      </svg>
    );
  }
  if (variant === "lake") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice">
        <rect width="400" height="120" fill="#14332b" />
        <rect y="70" width="400" height="50" fill="#3e8e83" opacity="0.55" />
        <polygon points="0,80 70,22 130,80" fill="#1b4034" />
        <polygon points="230,80 300,30 370,80" fill="#2e7d4f" />
        <rect y="78" width="400" height="4" fill="#7fb4c9" opacity="0.6" />
        <rect y="90" width="400" height="2" fill="#7fb4c9" opacity="0.4" />
        <rect y="102" width="400" height="2" fill="#7fb4c9" opacity="0.3" />
      </svg>
    );
  }
  return (
    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice">
      <rect width="400" height="120" fill="#14332b" />
      <polygon points="20,120 50,54 80,120" fill="#0e1f1a" />
      <polygon points="60,120 100,38 140,120" fill="#1b4034" />
      <polygon points="130,120 170,60 210,120" fill="#0e1f1a" />
      <polygon points="250,120 295,44 340,120" fill="#1b4034" />
      <polygon points="320,120 355,62 390,120" fill="#0e1f1a" />
      <rect y="112" width="400" height="8" fill="#0a1613" />
      <circle cx="40" cy="20" r="3" fill="#f7f1e3" opacity="0.7" />
      <circle cx="90" cy="14" r="2" fill="#f7f1e3" opacity="0.5" />
      <circle cx="330" cy="18" r="2.5" fill="#f7f1e3" opacity="0.6" />
    </svg>
  );
}
