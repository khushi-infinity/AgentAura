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
        <main className="flex-1 min-w-0 relative">
          {/* Ambient environment behind the functional UI (spec §6). */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.22]" aria-hidden>
            <AmbientScenery />
          </div>
          <div className="relative">{children}</div>
        </main>
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
/**
 * Environmental pixel-art scenery (spec §6). Natural scenery only: forests,
 * mountains, lakes, cliffs, waterfalls, flowers, ruins and distant ranges.
 * Serene and calm; no neon, no floating islands, no medieval village, no
 * humans. Pure SVG on an 8px-feel grid, crisp at any size, zero assets.
 *
 * viewBox is 400x140 so the art reads as scenery rather than a thin band.
 */
const SKY = (
  <>
    <defs>
      <linearGradient id="pxSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#aaddff" />
        <stop offset="58%" stopColor="#88ccff" />
        <stop offset="100%" stopColor="#dceefc" />
      </linearGradient>
    </defs>
    <rect width="400" height="140" fill="url(#pxSky)" />
  </>
);

const SUN = (
  <>
    <circle cx="330" cy="30" r="17" fill="#faf2e2" opacity="0.22" />
    <circle cx="330" cy="30" r="11" fill="#faf2e2" opacity="0.95" />
  </>
);

const CLOUDS = (
  <g fill="#faf2e2">
    <rect x="26" y="20" width="40" height="5" opacity="0.85" />
    <rect x="34" y="27" width="26" height="5" opacity="0.65" />
    <rect x="148" y="13" width="32" height="4" opacity="0.6" />
    <rect x="236" y="36" width="46" height="5" opacity="0.5" />
    <rect x="248" y="43" width="28" height="4" opacity="0.4" />
    <rect x="66" y="47" width="36" height="4" opacity="0.38" />
  </g>
);

const BIRDS = (
  <g fill="#0f2b33" opacity="0.5">
    <rect x="118" y="32" width="4" height="2" />
    <rect x="124" y="30" width="4" height="2" />
    <rect x="144" y="40" width="4" height="2" />
    <rect x="150" y="38" width="4" height="2" />
  </g>
);

const GROUND = <rect y="132" width="400" height="8" fill="#01181f" />;

function Flowers() {
  const petals = [
    [196, 134, "#d9a441"],
    [206, 136, "#faf2e2"],
    [216, 134, "#88ccff"],
    [306, 135, "#d9a441"],
    [316, 133, "#faf2e2"],
    [52, 135, "#88ccff"],
    [62, 133, "#d9a441"],
    [352, 134, "#faf2e2"],
    [122, 136, "#007755"],
    [262, 135, "#88ccff"],
  ] as const;
  return (
    <g>
      {petals.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width="3" height="3" fill={c} />
      ))}
    </g>
  );
}

export function PixelScenery({
  variant = "forest",
}: {
  variant?: "forest" | "mountain" | "lake" | "cliff" | "waterfall" | "ruins" | "meadow";
}) {
  const common = (
    <>
      {SKY}
      {SUN}
      {CLOUDS}
      {BIRDS}
    </>
  );

  if (variant === "mountain") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {common}
        <polygon points="0,124 62,60 128,124" fill="#2f6b7d" />
        <polygon points="62,60 80,90 128,124 96,124" fill="#dceefc" opacity="0.85" />
        <polygon points="96,126 196,22 296,126" fill="#015c44" />
        <polygon points="196,22 228,72 262,126 196,126" fill="#dceefc" opacity="0.92" />
        <polygon points="152,126 178,80 204,126" fill="#012222" />
        <polygon points="264,126 330,64 400,126" fill="#2f6b7d" />
        <polygon points="330,64 348,94 400,126 366,126" fill="#dceefc" opacity="0.8" />
        <polygon points="0,126 400,126 400,140 0,140" fill="#015c44" opacity="0.35" />
        {GROUND}
        <Flowers />
      </svg>
    );
  }

  if (variant === "lake") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {common}
        <polygon points="0,92 54,44 108,92" fill="#2f6b7d" />
        <polygon points="54,44 70,70 108,92 80,92" fill="#dceefc" opacity="0.8" />
        <polygon points="288,92 342,50 400,92" fill="#2f6b7d" />
        <polygon points="342,50 358,78 400,92 366,92" fill="#dceefc" opacity="0.8" />
        <rect y="92" width="400" height="40" fill="#2f6b7d" />
        <rect y="92" width="400" height="40" fill="#88ccff" opacity="0.28" />
        <rect y="98" width="400" height="3" fill="#dceefc" opacity="0.5" />
        <rect y="110" width="400" height="3" fill="#dceefc" opacity="0.38" />
        <rect y="124" width="400" height="3" fill="#dceefc" opacity="0.26" />
        <rect x="150" y="104" width="44" height="3" fill="#dceefc" opacity="0.3" />
        <rect x="252" y="118" width="36" height="3" fill="#dceefc" opacity="0.22" />
        <g fill="#015c44">
          <rect x="16" y="120" width="3" height="12" />
          <rect x="22" y="116" width="3" height="16" />
          <rect x="28" y="122" width="3" height="10" />
          <rect x="374" y="118" width="3" height="14" />
          <rect x="380" y="122" width="3" height="10" />
        </g>
        {GROUND}
      </svg>
    );
  }

  if (variant === "cliff") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {common}
        <rect y="96" width="400" height="36" fill="#2f6b7d" opacity="0.75" />
        <rect y="96" width="400" height="3" fill="#dceefc" opacity="0.5" />
        <rect y="108" width="400" height="2" fill="#dceefc" opacity="0.3" />
        <polygon points="0,140 0,84 30,84 30,96 62,96 62,112 96,112 96,140" fill="#0f2b33" />
        <polygon points="0,84 30,84 30,96 62,96 62,112 96,112 96,140 40,140" fill="#012222" opacity="0.5" />
        <polygon points="268,140 268,108 302,108 302,92 336,92 336,80 400,80 400,140" fill="#0f2b33" />
        <polygon points="336,80 400,80 400,140 350,140 350,108 320,108 320,92 336,92" fill="#012222" opacity="0.45" />
        <g fill="#007755">
          <rect x="6" y="78" width="4" height="6" />
          <rect x="14" y="80" width="4" height="4" />
          <rect x="54" y="90" width="4" height="6" />
          <rect x="342" y="74" width="4" height="6" />
          <rect x="352" y="76" width="4" height="4" />
        </g>
        {GROUND}
      </svg>
    );
  }

  if (variant === "waterfall") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {common}
        <polygon points="0,140 0,66 44,66 44,84 92,84 92,106 140,106 140,140" fill="#0f2b33" />
        <polygon points="260,140 260,106 308,106 308,84 356,84 356,66 400,66 400,140" fill="#0f2b33" />
        <polygon points="140,140 140,100 176,100 176,80 200,80 200,74 232,74 232,80 260,80 260,100 260,140" fill="#2f6b7d" />
        <g>
          <rect x="186" y="84" width="6" height="34" fill="#dceefc" opacity="0.95" />
          <rect x="196" y="84" width="6" height="40" fill="#e9f6ff" opacity="0.9" />
          <rect x="206" y="84" width="6" height="34" fill="#dceefc" opacity="0.95" />
          <rect x="216" y="86" width="6" height="28" fill="#88ccff" opacity="0.85" />
          <rect x="226" y="88" width="6" height="24" fill="#88ccff" opacity="0.7" />
        </g>
        <rect y="118" width="400" height="16" fill="#2f6b7d" />
        <rect y="118" width="400" height="16" fill="#88ccff" opacity="0.3" />
        <rect y="124" width="400" height="2" fill="#dceefc" opacity="0.5" />
        <g fill="#faf2e2" opacity="0.55">
          <rect x="180" y="112" width="3" height="3" />
          <rect x="192" y="116" width="3" height="3" />
          <rect x="210" y="113" width="3" height="3" />
          <rect x="224" y="117" width="3" height="3" />
          <rect x="236" y="112" width="3" height="3" />
        </g>
        {GROUND}
      </svg>
    );
  }

  if (variant === "ruins") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {common}
        <polygon points="0,112 70,86 150,112 240,84 330,112 400,92 400,140 0,140" fill="#007755" opacity="0.55" />
        <polygon points="0,124 90,104 200,124 300,102 400,124 400,140 0,140" fill="#015c44" opacity="0.6" />
        <g fill="#b6a684">
          <rect x="60" y="76" width="14" height="48" />
          <rect x="56" y="70" width="22" height="8" />
          <rect x="92" y="88" width="14" height="36" />
          <rect x="88" y="82" width="22" height="8" />
          <rect x="130" y="66" width="14" height="58" />
          <rect x="126" y="60" width="22" height="8" />
          <rect x="172" y="82" width="60" height="10" />
          <rect x="240" y="92" width="14" height="32" />
          <rect x="236" y="86" width="22" height="8" />
          <rect x="286" y="80" width="52" height="10" />
          <rect x="292" y="90" width="12" height="34" />
        </g>
        <g fill="#0f2b33" opacity="0.25">
          <rect x="60" y="76" width="5" height="48" />
          <rect x="130" y="66" width="5" height="58" />
          <rect x="240" y="92" width="5" height="32" />
        </g>
        <g fill="#007755">
          <rect x="74" y="96" width="6" height="4" />
          <rect x="144" y="88" width="6" height="4" />
          <rect x="144" y="104" width="6" height="4" />
          <rect x="322" y="94" width="6" height="4" />
          <rect x="174" y="92" width="6" height="4" />
        </g>
        {GROUND}
        <Flowers />
      </svg>
    );
  }

  if (variant === "meadow") {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {common}
        <polygon points="0,116 80,88 170,116 260,86 340,116 400,96 400,140 0,140" fill="#007755" opacity="0.7" />
        <polygon points="0,128 100,110 220,128 320,108 400,128 400,140 0,140" fill="#015c44" />
        <g fill="#012222" opacity="0.55">
          <rect x="36" y="112" width="3" height="8" />
          <rect x="120" y="120" width="3" height="8" />
          <rect x="232" y="118" width="3" height="8" />
          <rect x="308" y="114" width="3" height="8" />
        </g>
        <g>
          <rect x="24" y="120" width="3" height="8" fill="#d9a441" />
          <rect x="58" y="126" width="3" height="6" fill="#faf2e2" />
          <rect x="90" y="118" width="3" height="8" fill="#88ccff" />
          <rect x="150" y="126" width="3" height="6" fill="#d9a441" />
          <rect x="196" y="122" width="3" height="8" fill="#faf2e2" />
          <rect x="258" y="124" width="3" height="7" fill="#88ccff" />
          <rect x="300" y="118" width="3" height="8" fill="#d9a441" />
          <rect x="352" y="126" width="3" height="6" fill="#faf2e2" />
          <rect x="378" y="120" width="3" height="8" fill="#88ccff" />
        </g>
        {GROUND}
      </svg>
    );
  }

  // forest (default) — treeline, distant ranges, flowers
  return (
    <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
      {common}
      <polygon points="0,106 70,74 150,106 232,70 322,106 400,88 400,140 0,140" fill="#2f6b7d" opacity="0.5" />
      <g>
        <polygon points="18,124 46,84 74,124" fill="#015c44" />
        <polygon points="62,124 94,72 126,124" fill="#012222" />
        <polygon points="112,124 142,88 172,124" fill="#015c44" />
        <polygon points="166,124 196,70 226,124" fill="#012222" />
        <polygon points="242,124 276,78 310,124" fill="#015c44" />
        <polygon points="296,124 326,90 356,124" fill="#012222" />
        <polygon points="340,124 370,78 400,124" fill="#015c44" />
      </g>
      <g fill="#01181f">
        <rect x="44" y="112" width="4" height="12" />
        <rect x="194" y="112" width="4" height="12" />
        <rect x="324" y="114" width="4" height="10" />
      </g>
      {GROUND}
      <Flowers />
    </svg>
  );
}

/**
 * Ambient atmospheric layer for the app canvas: a distant range and treeline
 * silhouette with a transparent sky, meant to sit behind content at low
 * opacity so the environment is felt without crowding the functional UI
 * (spec §6: functional UI 70-80%, environmental identity 20-30%).
 */
export function AmbientScenery() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 400 140"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
    >
      <polygon points="0,96 60,54 130,96 210,46 300,96 400,62 400,140 0,140" fill="#88ccff" opacity="0.5" />
      <polygon points="0,112 80,80 170,112 260,78 350,112 400,94 400,140 0,140" fill="#2f6b7d" opacity="0.55" />
      <g fill="#015c44" opacity="0.6">
        <polygon points="20,134 48,96 76,134" />
        <polygon points="70,134 100,88 130,134" />
        <polygon points="176,134 206,102 236,134" />
        <polygon points="246,134 278,92 310,134" />
        <polygon points="318,134 348,104 378,134" />
      </g>
      <rect y="132" width="400" height="8" fill="#01181f" opacity="0.8" />
    </svg>
  );
}
