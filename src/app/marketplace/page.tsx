"use client";

import { PixelSprite } from "@/components/PixelSprite";

import { useCallback, useEffect, useState } from "react";
import { Card, Badge, PixelButton, EmptyState, DemoTag } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";

// Marketplace (spec §8): search + filters, featured services, provider
// cards with capability, reputation, price and Hire. Data flows through
// POST /api/marketplace/discover — the same adapter the engine uses.

interface Offer {
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceType: "A2A" | "A2MCP";
  category: string;
  tagline: string;
  priceCents: number;
  priceUnit: string;
  reputation: number;
  completedTasks: number;
  successRate: number;
  capabilities: string[];
  isDemo: boolean;
  taskFit: number;
  reasons: string[];
}

const CATEGORIES = ["All", "Research", "Content", "Development", "Marketing", "Design", "Operations"];

export default function MarketplacePage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(true);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: q || "market research, content, development, design, operations",
          keywords: q ? q.split(/\s+/) : [],
        }),
      });
      const data = (await res.json()) as { offers: Offer[]; demoMode: boolean };
      setOffers(data.offers ?? []);
      setDemo(data.demoMode);
      setSelected((cur) => (data.offers ?? []).find((o) => o.providerId === cur?.providerId) ?? (data.offers ?? [])[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search("");
  }, [search]);

  const shown = cat === "All" ? offers : offers.filter((o) => o.category === cat);

  return (
    <div>
      <Hero
        title="Agent Marketplace"
        subtitle="Discover and hire specialized agents"
        art={<PixelScenery variant="mountain" />}
      />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden><PixelSprite name="marketplace" size={22} /></span>
            <span className="font-pixel text-[10px] text-cream">OKX.AI services</span>
            {demo ? <DemoTag /> : <Badge color="leaf">live</Badge>}
          </div>
          <form
            className="flex-1 min-w-[220px] flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              search(query);
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents (e.g. market research, design, SEO…)"
              className="flex-1 border-2 border-[#0f2b33] bg-cream rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-leaf"
            />
            <PixelButton type="submit" className="!text-[9px] !py-2.5">Search</PixelButton>
          </form>
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`pixel-btn !text-[9px] !py-2 !px-3 ${cat === c ? "pixel-btn-primary" : "pixel-btn-ghost"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid xl:grid-cols-[1.5fr_1fr] gap-5 items-start">
          <div className="space-y-3 min-w-0">
            {loading ? (
              <div className="text-ink-soft text-sm">Discovering services…</div>
            ) : shown.length === 0 ? (
              <EmptyState icon="marketplace" title="No services match" hint="Try a different search or category." />
            ) : (
              shown.map((o) => (
                <button key={o.providerId} className="block w-full text-left" onClick={() => setSelected(o)}>
                  <Card className={`p-4 transition-shadow hover:shadow-pixel ${selected?.providerId === o.providerId ? "ring-2 ring-leaf" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{o.providerName}</span>
                          <Badge color="teal">{o.serviceType}</Badge>
                          <Badge color="muted">{o.category}</Badge>
                        </div>
                        <div className="text-xs text-ink-soft mt-1">{o.tagline}</div>
                        <div className="text-xs text-ink-soft mt-1.5">
                          ★ {(o.reputation / 10).toFixed(1)} · {o.completedTasks.toLocaleString()} tasks · {o.successRate}% success
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-pixel text-[10px] text-gold-deep">{(o.priceCents / 100).toFixed(2)} USD₮0</div>
                        <div className="text-[10px] text-ink-soft">/ {o.priceUnit}</div>
                      </div>
                    </div>
                  </Card>
                </button>
              ))
            )}
          </div>

          {/* Detail panel */}
          {selected ? (
            <Card className="p-4 xl:sticky xl:top-4">
              <div className="font-pixel text-[10px] mb-1">{selected.providerName}</div>
              <div className="text-xs text-ink-soft mb-3">{selected.tagline}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selected.capabilities.slice(0, 6).map((c) => (
                  <Badge key={c} color="teal">{c}</Badge>
                ))}
              </div>
              <div className="pixel-rule my-3" />
              <div className="font-pixel text-sm text-gold-deep">
                {(selected.priceCents / 100).toFixed(2)} USD₮0 <span className="text-[10px] text-ink-soft">/ {selected.priceUnit}</span>
              </div>
              <div className="text-xs text-ink-soft mt-1">
                {selected.completedTasks.toLocaleString()} completed tasks · {selected.successRate}% success rate
              </div>
              <div className="pixel-rule my-3" />
              <div className="pixel-label mb-1.5">Why agents pick this provider</div>
              <ul className="text-xs text-ink-soft list-disc list-inside space-y-1">
                {selected.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <p className="text-[10px] text-ink-soft mt-3">
                Selection factors are explainable, not an objective “best” (spec §10). Settlement:{" "}
                {selected.serviceType === "A2A" ? "A2A escrow released on acceptance" : "A2MCP instant per call"}.
              </p>
              <PixelButton variant="gold" className="w-full mt-4" onClick={() => alert(`Hiring flow runs automatically when an internal agent detects this capability gap during a mission.`)}>
                Hire Agent
              </PixelButton>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
