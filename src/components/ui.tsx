"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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

export function Badge({
  color = "leaf",
  children,
}: {
  color?: "leaf" | "gold" | "teal" | "plum" | "danger" | "sky" | "muted";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    leaf: "bg-[#ddefe2] text-leaf-deep border-leaf",
    gold: "bg-[#f7ecd2] text-gold-deep border-gold",
    teal: "bg-[#dceeee] text-teal border-teal",
    plum: "bg-[#e9e2f4] text-plum border-plum",
    danger: "bg-[#f6dfdc] text-danger border-danger",
    sky: "bg-[#dfeef5] text-[#417a94] border-sky",
    muted: "bg-parchment2 text-ink-soft border-[#b3a888]",
  };
  return (
    <span className={`pixel-label inline-flex items-center gap-1 border px-1.5 py-1 rounded-sm ${map[color]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ pct, color = "leaf" }: { pct: number; color?: "leaf" | "gold" }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-3 w-full border-2 border-[#143329] bg-parchment2 overflow-hidden rounded-sm">
      <div
        className={`h-full ${color === "leaf" ? "bg-leaf" : "bg-gold"} transition-all duration-700`}
        style={{ width: `${p}%`, imageRendering: "pixelated" }}
      />
    </div>
  );
}

export function Stat({
  icon,
  value,
  label,
  accent = "text-leaf-deep",
}: {
  icon: string;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <div>
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

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="text-4xl mb-3" aria-hidden>
        {icon}
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
