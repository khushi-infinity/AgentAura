"use client";

import { useCallback, useEffect, useState } from "react";

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

  // Hiring Flow Modal state — driven by the REAL engine (POST /api/marketplace/hire
  // runs task → OKX publish/deliver → Verification Agent → settlement) and the
  // company's SSE stream, so every step shown here is a real engine event.
  const [hiringModalOpen, setHiringModalOpen] = useState(false);
  const [hireStep, setHireStep] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [hireStatus, setHireStatus] = useState<"idle" | "escrowing" | "running" | "verified" | "settled" | "failed">("idle");
  const [hireMessage, setHireMessage] = useState("");
  const [hireError, setHireError] = useState<string | null>(null);
  const [hireTxHash, setHireTxHash] = useState<string | null>(null);
  const [hireLog, setHireLog] = useState<{ title: string; detail?: string; kind: "you" | "provider" | "engine" }[]>([]);
  const [hireBusy, setHireBusy] = useState(false);

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

  const startHireFlow = (offer: Offer) => {
    setSelected(offer);
    setHireStep(2);
    setHireStatus("idle");
    setHireError(null);
    setHireTxHash(null);
    setHireLog([]);
    setHireBusy(false);
    setHiringModalOpen(true);
  };

  // Map real engine events → modal steps + live log.
  const applyEngineEvent = (ev: { type?: string; title?: string; detail?: string | null; payload?: { txHash?: string | null } | null }) => {
    if (!ev?.type) return;
    const t = ev.title ?? "";
    const d = ev.detail ?? undefined;
    const isProvider = /Polyglot|MarketMind|Lingo|Pixel|ChainSight|delivered|Quote/i.test(t);
    const kind: "you" | "provider" | "engine" = ev.type === "TASK_CREATED" ? "you" : isProvider ? "provider" : "engine";
    setHireLog((cur) => [...cur.slice(-40), { title: t, detail: d, kind }]);
    switch (ev.type) {
      case "EXTERNAL_TASK_CREATED":
      case "PAYMENT_QUOTED":
        setHireStep(3);
        setHireStatus("running");
        break;
      case "VERIFICATION_PASSED":
        setHireStep(4);
        setHireStatus("verified");
        break;
      case "PAYMENT_SETTLED":
        setHireStep(5);
        setHireStatus("settled");
        setHireTxHash(ev.payload?.txHash ?? null);
        break;
      case "PAYMENT_FAILED":
      case "VERIFICATION_FAILED":
        setHireStatus("failed");
        setHireError(t + (d ? ` — ${d}` : ""));
        break;
    }
  };

  const executeHire = async () => {
    if (!selected) return;
    setHireBusy(true);
    setHireError(null);
    setHireStatus("escrowing");
    setHireLog([{ title: "You", detail: selected.tagline ? `${selected.tagline}. Objective: analyze and produce the deliverable with evidence.` : "Please analyze and produce the deliverable with evidence.", kind: "you" }]);
    try {
      // Resolve the workspace company the same way the rest of the app does.
      const cres = await fetch("/api/companies");
      const cdata = (await cres.json()) as { company?: { id: string } | null };
      const companyId = cdata.company?.id;
      if (!companyId) {
        setHireStatus("failed");
        setHireError("Create your company first (finish onboarding), then hire.");
        return;
      }

      // Live engine events while the hire runs.
      const es = new EventSource(`/api/companies/${companyId}/events`);
      es.onmessage = (m) => {
        try {
          const msg = JSON.parse(m.data) as { kind: string; event?: { type?: string; title?: string; detail?: string | null; payload?: { txHash?: string | null } | null } };
          if (msg.kind === "live" && msg.event) applyEngineEvent(msg.event);
        } catch { /* ignore malformed frames */ }
      };

      const res = await fetch("/api/marketplace/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selected.providerId, objective: `Do ${selected.category.toLowerCase()} work: ${selected.tagline}. Produce the deliverable with evidence.`.slice(0, 380), companyId }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setHireStatus("failed");
        setHireError(data.message ?? "Hire failed — try again.");
      }
      // Give the SSE a beat to flush the final event before closing.
      setTimeout(() => es.close(), 4000);
    } catch (err) {
      setHireStatus("failed");
      setHireError((err as Error)?.message ?? "Network error during hire");
    } finally {
      setHireBusy(false);
    }
  };

  return (
    <main className="flex-1 bg-[#F9FBFC] flex flex-col overflow-y-auto">
      {/* Hero Banner Header */}
      <section className="p-4 pb-2" data-purpose="marketplace-hero">
        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-teal-900/10 shadow-sm flex items-center">
          <img
            alt="Scenic Pixel Art Mountain Landscape"
            className="absolute inset-0 w-full h-full object-cover object-center filter saturate-110"
            src="/banners/forest.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent w-full md:w-3/5" />
          <div className="relative z-10 pl-8 pr-4">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#052126] tracking-tight">
              OKX AI Marketplace
            </h2>
            <p className="text-slate-600 font-medium text-xs lg:text-sm mt-1">
              Discover and hire specialized AI service providers (ASPs) on OKX AI — discovered via A2A/A2MCP, settled on X Layer.
            </p>
          </div>
          <div className="absolute right-6 top-6 hidden md:flex items-center space-x-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-teal-200/80 shadow-md">
            <span className="text-teal-700 text-lg">✦</span>
            <span className="text-slate-800 font-semibold text-xs tracking-tight leading-none">
              “The right expertise, on demand.”
            </span>
          </div>
        </div>
      </section>

      {/* Search, Filters and Categories */}
      <section className="px-4 py-2 space-y-3" data-purpose="filtering-section">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(query)}
              className="w-full pl-4 pr-4 py-2.5 bg-white border border-teal-100 rounded-xl text-xs md:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm"
              placeholder="Search agents (e.g. market research, design, SEO...)"
              type="text"
            />
          </div>
          <button
            onClick={() => search(query)}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-teal-100 px-5 py-2.5 rounded-xl text-slate-700 text-xs md:text-sm font-semibold shadow-sm transition"
          >
            <span>Filter</span>
          </button>
        </div>

        {/* Category Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-lg transition whitespace-nowrap ${
                cat === c
                  ? "bg-[#0e7a68] text-white shadow-sm"
                  : "bg-[#eef4f9] text-[#2c475d] hover:bg-teal-50 border border-teal-50/50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Content Columns (Catalog + Inspector) */}
      <section className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 items-start">
        {/* Left Column: Agent List Cards (7 cols) */}
        <div className="xl:col-span-7 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">Searching marketplace...</div>
          ) : shown.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <span className="text-2xl">🏬</span>
              <p className="text-xs font-bold text-slate-700 mt-2">No agent offers found for "{cat}"</p>
            </div>
          ) : (
            shown.map((off) => {
              const isSelected = selected?.providerId === off.providerId;
              return (
                <div
                  key={off.providerId}
                  onClick={() => setSelected(off)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-white border-teal-500 shadow-md ring-1 ring-teal-500"
                      : "bg-white border-teal-200/90 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl flex-shrink-0">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {off.providerName}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{off.tagline}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-bold text-amber-600">★ {off.reputation.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400">({off.completedTasks} tasks)</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700">
                          {off.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-[#0e7a68]">
                      {(off.priceCents / 100).toFixed(2)} USDT
                    </div>                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startHireFlow(off);
                      }}
                      className="mt-2 px-3 py-1 bg-[#006050] hover:bg-[#004d40] text-white text-[11px] font-bold rounded-lg transition"
                    >
                      Hire on OKX AI
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Agent Detail Inspector (5 cols) */}
        <div className="xl:col-span-5 bg-white border border-teal-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          {selected ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-3xl">
                    🤖
                  </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {selected.providerName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.serviceType} · OKX AI ASP</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-amber-600">★ {selected.reputation.toFixed(1)}</span>
                      <span className="text-[11px] text-slate-400">· {selected.completedTasks} completed</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  {(selected.priceCents / 100).toFixed(2)} USDT
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Overview</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selected.tagline}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Capabilities</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.capabilities?.map((c) => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>🛡️</span> OKX AI · x402 Protected Payment
                </div>
                <p className="text-[11px] text-amber-800 leading-normal">
                  {demo
                    ? "Demo mode: the OKX AI protocol flow (402 quote → EIP-3009 signature → x402 settlement) is simulated but honestly labeled."
                    : "Live mode: real x402 settlements on OKX X Layer testnet via your Agentic Wallet."} Payment only moves after the Verification Agent accepts the deliverable.
                </p>
              </div>

              <button
                onClick={() => startHireFlow(selected)}
                className="w-full py-3 bg-[#006050] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl shadow transition"
              >
                Hire on OKX AI ({(selected.priceCents / 100).toFixed(2)} USDT) →
              </button>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">Select an agent to inspect details</div>
          )}
        </div>
      </section>

      {/* Screen 7: Agent Hiring Flow Modal */}
      {hiringModalOpen && selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border-2 border-teal-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header & 5-Step Stepper */}
            <div className="bg-[#022f30] text-white p-4 flex items-center justify-between border-b border-[#0d4a4d]">
              <div>
                <h3 className="font-bold text-sm">Hiring on OKX AI: {selected.providerName}</h3>
                <p className="text-[11px] text-emerald-300">Live engine run · x402 settlement on X Layer</p>
              </div>

              {/* Stepper */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
                {[
                  { n: 1, label: "Discover" },
                  { n: 2, label: "Hire & Escrow" },
                  { n: 3, label: "Execute" },
                  { n: 4, label: "Review" },
                  { n: 5, label: "Complete" },
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        hireStep >= s.n ? "bg-emerald-400 text-slate-950" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {s.n}
                    </span>
                    <span className={hireStep >= s.n ? "text-white" : "text-slate-400"}>{s.label}</span>
                    {s.n < 5 && <span className="text-slate-600">→</span>}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setHiringModalOpen(false)}
                className="text-slate-400 hover:text-white text-base font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: 3 Panels */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-y-auto">
              {/* Panel 1: Live engine event stream (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between h-[360px]">
                <div className="space-y-3 overflow-y-auto text-xs">
                  {hireLog.length === 0 && hireStatus === "idle" && (
                    <div className="text-slate-400 text-center py-8">Press “Deposit to Escrow & Start” to run the real OKX AI hire.</div>
                  )}
                  {hireLog.map((m, i) => (
                    <div
                      key={i}
                      className={
                        m.kind === "you"
                          ? "bg-sky-100/70 p-2.5 rounded-xl border border-sky-200"
                          : m.kind === "provider"
                            ? "bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs"
                            : "bg-slate-100 p-2.5 rounded-xl border border-slate-200"
                      }
                    >
                      <span className={`font-bold ${m.kind === "provider" ? "text-teal-800" : m.kind === "you" ? "text-sky-950" : "text-slate-700"}`}>
                        {m.kind === "you" ? "You:" : m.kind === "provider" ? `${selected.providerName}:` : "Engine:"}
                      </span>
                      <p className="text-slate-800 mt-0.5">{m.title}</p>
                      {m.detail && <p className="text-[11px] text-slate-500 mt-0.5">{m.detail}</p>}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <input
                    value={hireMessage}
                    onChange={(e) => setHireMessage(e.target.value)}
                    placeholder="Note to self (local only)..."
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none"
                  />
                  <span className="px-3 py-1 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold">Log</span>
                </div>
              </div>

              {/* Panel 2: Task Execution Timeline (3 cols) */}
              <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-xs h-[360px]">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Execution Timeline</h4>
                <div className="space-y-2.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={hireStep >= 2 ? "text-emerald-600 font-bold" : "text-slate-400"}>✓</span>
                    <span>1. Escrow Lock: {(selected.priceCents / 100).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hireStep >= 3 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {hireStep === 3 ? "⏳" : hireStep > 3 ? "✓" : "○"}
                    </span>
                    <span>2. Autonomous Work Running</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hireStep >= 4 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {hireStep === 4 ? "🔍" : hireStep > 4 ? "✓" : "○"}
                    </span>
                    <span>3. Quality Verification Pass</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={hireStep >= 5 ? "text-emerald-600 font-bold" : "text-slate-400"}>
                      {hireStep === 5 ? "✓" : "○"}
                    </span>
                    <span>4. Payment Settled onchain</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  Network: OKX X Layer Testnet · x402 settlement
                </div>
              </div>

              {/* Panel 3: Escrow & Actions (4 cols) */}
              <div className="md:col-span-4 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between text-xs h-[360px]">
                <div className="space-y-3">
                  <h4 className="font-bold text-emerald-950">OKX Payment Details</h4>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-100 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Service Fee:</span>
                      <span className="font-bold">{(selected.priceCents / 100).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rail:</span>
                      <span className="font-bold text-emerald-700">x402 · Agentic Wallet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-emerald-700">
                        {hireStatus === "idle" && "Ready to Lock"}
                        {hireStatus === "escrowing" && "Locking in Escrow..."}
                        {hireStatus === "running" && "Funds Locked in Escrow"}
                        {hireStatus === "verified" && "Work Verified ✓"}
                        {hireStatus === "settled" && "Settled to Provider ✓"}
                        {hireStatus === "failed" && "Failed — see log"}
                      </span>
                    </div>
                    {hireTxHash && (
                      <div className="pt-1 border-t border-emerald-50">
                        <span className="text-slate-500">txHash:</span>
                        <span className="font-mono text-[10px] text-emerald-800 break-all">{hireTxHash}</span>
                      </div>
                    )}
                  </div>
                  {hireError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">{hireError}</div>
                  )}
                </div>

                <div className="space-y-2">
                  {hireStep === 2 && (
                    <button
                      onClick={executeHire}
                      disabled={hireStatus === "escrowing" || hireBusy}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition text-xs"
                    >
                      {hireStatus === "escrowing" || hireBusy ? "Running OKX AI hire…" : "Deposit to Escrow & Start →"}
                    </button>
                  )}

                  {hireStep === 4 && (
                    <button
                      disabled
                      className="w-full py-2.5 bg-emerald-600/60 text-white font-bold rounded-xl text-xs"
                    >
                      Verification Agent releasing payment…
                    </button>
                  )}

                  {hireStep === 5 && (
                    <button
                      onClick={() => setHiringModalOpen(false)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition text-xs"
                    >
                      Done / Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
