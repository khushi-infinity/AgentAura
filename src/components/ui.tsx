"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { PixelSprite } from "./PixelSprite";

// Pixel UI primitives (spec §6/§7). Hard edges, cream surfaces, bevels.

type BtnVariant = "primary" | "gold" | "ghost";

export function PixelButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const v = variant === "primary" ? "pixel-btn-primary" : variant === "gold" ? "pixel-btn-gold" : "pixel-btn-ghost";
  return (
    <button className={`pixel-btn ${v} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function PixelLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: BtnVariant;
  className?: string;
  children: ReactNode;
}) {
  const v = variant === "primary" ? "pixel-btn-primary" : variant === "gold" ? "pixel-btn-gold" : "pixel-btn-ghost";
  return (
    <Link href={href} className={`pixel-btn ${v} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`pixel-card ${className}`}>{children}</div>;
}

/** Dark header bar for a chunky card (reference: cream cards, dark headers). */
export function CardHead({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`pixel-card-head ${className}`}>{children}</div>;
}

export function Badge({
  color = "leaf",
  children,
}: {
  color?: "leaf" | "gold" | "teal" | "plum" | "danger" | "sky" | "muted" | "steel";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    leaf: "bg-[#d8efe4] text-leaf-deep border-leaf",
    gold: "bg-[#f7ecd2] text-gold-deep border-gold",
    teal: "bg-[#d8ebef] text-teal border-teal",
    plum: "bg-[#e6dff3] text-plum border-plum",
    danger: "bg-[#f4ded9] text-danger border-danger",
    sky: "bg-[#dceefc] text-[#2f6b7d] border-sky",
    steel: "bg-[#d3dde8] text-[#304860] border-steel",
    muted: "bg-parchment2 text-ink-soft border-[#b6a684]",
  };
  return (
    <span className={`pixel-label inline-flex items-center gap-1 border px-1.5 py-1 rounded-sm ${map[color]}`}>
      {children}
    </span>
  );
}

type BarColor = "leaf" | "gold" | "steel" | "sky";

const BAR_FILL: Record<BarColor, string> = {
  leaf: "bg-leaf",
  gold: "bg-gold",
  steel: "bg-steel",
  sky: "bg-sky-bright",
};

export function ProgressBar({ pct, color = "leaf" }: { pct: number; color?: BarColor }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-3 w-full border-2 border-[#0f2b33] bg-parchment2 overflow-hidden rounded-sm">
      <div
        className={`h-full ${BAR_FILL[color]} transition-all duration-700`}
        style={{ width: `${p}%`, imageRendering: "pixelated" }}
      />
    </div>
  );
}

/**
 * Labelled blue meter — the reference's signature element. The first pass had
 * only near-empty cream cards with hairline dividers; the reference is full of
 * these filled bars, which is most of why it read as "richer" than the build.
 */
export function MeterRow({
  label,
  value,
  pct,
  color = "steel",
}: {
  label: string;
  value?: string;
  pct: number;
  color?: BarColor;
}) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="pixel-label text-ink-soft truncate">{label}</span>
        {value ? <span className="pixel-label text-ink shrink-0">{value}</span> : null}
      </div>
      <div className="pixel-meter">
        <span className={BAR_FILL[color]} style={{ width: `${p}%`, transition: "width 700ms" }} />
      </div>
    </div>
  );
}

/** Dense hairline-separated row (reference uses these instead of big gaps). */
export function Row({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`pixel-row ${className}`}>{children}</div>;
}

export function Stat({
  icon,
  value,
  label,
  accent = "text-leaf-deep",
}: {
  /** Glyph name from PixelSprite (e.g. "agents", "wallet"). */
  icon: string;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span
        className="w-9 h-9 shrink-0 flex items-center justify-center bg-parchment border-2 border-[#0f2b33] text-leaf-deep"
        aria-hidden
      >
        <PixelSprite name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <div className={`font-pixel text-sm ${accent}`}>{value}</div>
        <div className="pixel-label text-ink-soft mt-1">{label}</div>
      </div>
    </Card>
  );
}

export function SectionTitle({ title, quote }: { title: string; quote?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h1 className="font-pixel text-cream text-lg leading-relaxed drop-shadow-[2px_2px_0_rgba(0,0,0,0.4)]">{title}</h1>
      {quote ? <span className="hidden md:block text-cream/70 text-xs italic">“{quote}”</span> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  /** Glyph name from PixelSprite. */
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="mb-3 flex justify-center text-leaf-deep" aria-hidden>
        <PixelSprite name={icon} size={40} />
      </div>
      <div className="font-pixel text-xs text-ink">{title}</div>
      {hint ? <div className="text-ink-soft text-sm mt-2">{hint}</div> : null}
    </Card>
  );
}

export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="Simulated event — DEMO_MODE is ON. Nothing here is onchain."
      className={`pixel-label bg-[#f7ecd2] text-gold-deep border border-gold px-1.5 py-0.5 rounded-sm ${className}`}
    >
      ◈ simulated
    </span>
  );
}
