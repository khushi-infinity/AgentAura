"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { PixelSprite, GLYPHS, AGENT_MARK } from "./PixelSprite";

// Shared UI shell (spec §7), matched to the reference layout:
//   - slim icon rail on the left (~61px in the reference), dark teal-blue
//   - thin top status bar (date/session · connection · wallet · avatar)
//   - page hero: environmental pixel-art strip, title, subtitle
//   - bottom status strip: OKX AI · X Layer · Agentic Wallet
//
// Icons are real pixel sprites drawn on an 8x8 grid (spec §6: pixel-art
// identity, expressive robot/AI-agent sprites, no humans).


const NAV = [
  { href: "/", key: "home", label: "Home" },
  { href: "/missions", key: "missions", label: "Missions" },
  { href: "/agents", key: "agents", label: "Agents" },
  { href: "/marketplace", key: "marketplace", label: "Marketplace" },
  { href: "/memory", key: "memory", label: "Company Memory" },
  { href: "/analytics", key: "analytics", label: "Analytics" },
  { href: "/wallet", key: "wallet", label: "Wallet" },
  { href: "/settings", key: "settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === "/onboarding" || pathname === "/create";
  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-forest">
      {/* ── Slim navigation rail (icon-only, like the reference) ── */}
      <aside className="w-16 shrink-0 bg-forest-2 border-r-2 border-[#01141c] flex flex-col sticky top-0 h-screen z-20">
        <Link
          href="/"
          title="AgentAura"
          className="h-14 flex items-center justify-center border-b-2 border-[#01141c] text-leaf-bright hover:text-cream transition-colors"
        >
          <PixelSprite glyph={AGENT_MARK} size={26} />
        </Link>

        <nav className="flex-1 py-1 overflow-y-auto pixel-scroll">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                aria-label={n.label}
                data-active={active}
                className="rail-btn"
              >
                <PixelSprite glyph={GLYPHS[n.key]} size={20} />
              </Link>
            );
          })}
        </nav>

        <Link
          href="/create"
          title="New company"
          aria-label="New company"
          className="h-14 flex items-center justify-center border-t-2 border-[#01141c] text-gold hover:text-cream transition-colors"
        >
          <span className="font-pixel text-base leading-none">+</span>
        </Link>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopStatusBar />
        <main className="flex-1 min-w-0">{children}</main>
        <StatusStrip />
      </div>
    </div>
  );
}

/** Thin top status bar: date/session, connection, wallet balance, avatar. */
function TopStatusBar() {
  const [now, setNow] = useState<string>("--:--");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  // Live treasury balance — never hardcode money in the chrome.
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const c = await fetch("/api/companies");
        if (!c.ok) return;
        const cj = (await c.json()) as { company?: { id: string } };
        if (!cj.company?.id) return;
        const w = await fetch(`/api/wallet?companyId=${cj.company.id}`);
        if (!w.ok) return;
        const wj = (await w.json()) as { wallet?: { availableCents?: number } };
        if (!stop) setBalance(wj.wallet?.availableCents ?? null);
      } catch {
        /* noop */
      }
    };
    load();
    const t = setInterval(load, 8000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);

  return (
    <header className="bg-chrome border-b-2 border-[#01141c] h-9 px-4 flex items-center gap-4 text-[11px] text-cream/75 sticky top-0 z-10">
      <span className="hidden sm:inline">
        Day {new Date().getDate()} · Session
      </span>
      <span className="font-pixel text-[9px] text-leaf-bright">{now}</span>
      <span className="ml-auto flex items-center gap-3">
        <span className="hidden md:flex items-center gap-1.5">
          <span className="w-2 h-2 bg-leaf-bright animate-pulse-soft" />
          OKX AI connected
        </span>
        <span className="pixel-label bg-forest-3 text-leaf-bright border border-leaf px-1.5 py-1">
          {balance === null ? "— USD₮0" : `${(balance / 100).toFixed(2)} USD₮0`}
        </span>
        <span
          className="w-6 h-6 bg-forest-3 border border-[#01141c] flex items-center justify-center text-sky"
          title="Founder"
        >
          <PixelSprite glyph={AGENT_MARK} size={16} />
        </span>
      </span>
    </header>
  );
}

function StatusStrip() {
  return (
    <footer className="bg-forest-2 border-t-2 border-[#01141c] px-5 py-2 flex items-center gap-5 text-[10px] text-cream/55">
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-leaf-bright" />
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
      <span className="ml-auto hidden sm:inline opacity-60">Build a company. Let agents run it.</span>
    </footer>
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
    <div className="relative overflow-hidden border-b-2 border-[#01141c] bg-forest-2">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {art}
      </div>
      {/* Page hero: environmental pixel-art strip (spec §7), given enough
          height to read as scenery rather than a thin band. */}
      <div className="relative px-6 py-9 min-h-[132px] flex flex-col justify-center">
        <h1 className="font-pixel text-cream text-lg leading-relaxed drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
          {title}
        </h1>
        <p className="text-cream/70 text-sm mt-2 max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}

/**
 * Environmental pixel-art scenery (spec §6: forests, mountains, lakes,
 * cliffs, distant scenery — serene and calm, soft sky blues, no neon).
 * Pure SVG, crisp at any size, zero binary assets.
 */
export function PixelScenery({ variant = "forest" }: { variant?: "forest" | "mountain" | "lake" }) {
  const Sky = (
    <>
      <defs>
        <linearGradient id="px-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aaddff" />
          <stop offset="55%" stopColor="#88ccff" />
          <stop offset="100%" stopColor="#dceefc" />
        </linearGradient>
      </defs>
      <rect width="400" height="120" fill="url(#px-sky)" />
      <circle cx="330" cy="26" r="11" fill="#faf2e2" opacity="0.95" />
      <rect x="30" y="18" width="34" height="4" fill="#faf2e2" opacity="0.75" />
      <rect x="38" y="24" width="22" height="4" fill="#faf2e2" opacity="0.6" />
      <rect x="250" y="34" width="40" height="4" fill="#faf2e2" opacity="0.5" />
      <rect x="258" y="40" width="26" height="4" fill="#faf2e2" opacity="0.4" />
    </>
  );

  if (variant === "mountain") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {Sky}
        <polygon points="0,120 70,42 140,120" fill="#2f6b7d" />
        <polygon points="70,42 92,78 140,120" fill="#dceefc" opacity="0.9" />
        <polygon points="110,120 200,20 290,120" fill="#015c44" />
        <polygon points="200,20 232,72 290,120" fill="#dceefc" opacity="0.92" />
        <polygon points="255,120 330,56 400,120" fill="#2f6b7d" />
        <polygon points="330,56 348,86 400,120" fill="#dceefc" opacity="0.85" />
        <rect y="112" width="400" height="8" fill="#012222" />
      </svg>
    );
  }

  if (variant === "lake") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {Sky}
        <polygon points="0,74 60,32 120,74" fill="#2f6b7d" />
        <polygon points="60,32 78,58 120,74" fill="#dceefc" opacity="0.85" />
        <polygon points="280,74 340,26 400,74" fill="#015c44" />
        <polygon points="340,26 356,56 400,74" fill="#dceefc" opacity="0.85" />
        <rect y="74" width="400" height="46" fill="#2f6b7d" />
        <rect y="74" width="400" height="46" fill="#88ccff" opacity="0.25" />
        <rect y="82" width="400" height="3" fill="#dceefc" opacity="0.55" />
        <rect y="94" width="400" height="3" fill="#dceefc" opacity="0.4" />
        <rect y="106" width="400" height="3" fill="#dceefc" opacity="0.28" />
        <polygon points="0,74 60,32 120,74" fill="#0b2a33" opacity="0.25" />
      </svg>
    );
  }

  // forest (default) — treeline, flowers, distant hills
  return (
    <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
      {Sky}
      <polygon points="0,96 80,58 170,96 260,54 400,96 400,120 0,120" fill="#2f6b7d" opacity="0.55" />
      <polygon points="14,120 40,64 66,120" fill="#012222" />
      <polygon points="54,120 86,48 118,120" fill="#015c44" />
      <polygon points="104,120 132,70 160,120" fill="#012222" />
      <polygon points="150,120 178,56 206,120" fill="#015c44" />
      <polygon points="238,120 272,60 306,120" fill="#012222" />
      <polygon points="292,120 320,74 348,120" fill="#015c44" />
      <polygon points="338,120 366,66 394,120" fill="#012222" />
      <rect y="112" width="400" height="8" fill="#01181f" />
      <circle cx="200" cy="113" r="2" fill="#88ccff" />
      <circle cx="212" cy="114" r="2" fill="#d9a441" />
      <circle cx="224" cy="113" r="2" fill="#aaddff" />
      <circle cx="330" cy="114" r="2" fill="#d9a441" />
      <circle cx="46" cy="114" r="2" fill="#88ccff" />
    </svg>
  );
}
