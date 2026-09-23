"use client";

import { useEffect, useMemo, useState } from "react";

interface MemoryRow {
  id: string;
  type: string;
  folder: string;
  title: string;
  content: string;
  sourceAgentName: string | null;
  sourceTaskId: string | null;
  externalProviderId: string | null;
  confidence: number;
  verificationStatus: string;
  tags: string;
  createdAt: string;
}

const DEFAULT_MEMORIES: MemoryRow[] = [
  {
    id: "mem-1",
    type: "RESEARCH",
    folder: "research",
    title: "Competitor Analysis – AI Coding Tools",
    content: "Comparison of top 5 AI coding assistants including features, pricing models, token limits, and integration surfaces. Key opportunity: native agent-to-agent delegation with micro-escrow settlements.",
    sourceAgentName: "Research Agent",
    sourceTaskId: "task-01",
    externalProviderId: null,
    confidence: 0.96,
    verificationStatus: "VERIFIED",
    tags: "competitors, ai, coding, pricing",
    createdAt: "2 hours ago",
  },
  {
    id: "mem-2",
    type: "STRATEGY",
    folder: "strategies",
    title: "GTM Milestone: First 100 Early Adopters",
    content: "Target open-source developers building multi-agent systems. Offer 10 USDT demo credits via OKX X Layer testnet to test autonomous agent hiring and verification loops.",
    sourceAgentName: "Strategy Agent",
    sourceTaskId: "task-02",
    externalProviderId: null,
    confidence: 0.92,
    verificationStatus: "VERIFIED",
    tags: "gtm, users, growth, okx",
    createdAt: "5 hours ago",
  },
  {
    id: "mem-3",
    type: "REPORT",
    folder: "reports",
    title: "Market Sizing: Autonomous Agent Services",
    content: "Estimated TAM for autonomous B2B agent micro-tasks projected to exceed $12B by 2028. Agent marketplaces requiring decentralized escrow contracts will lead verification infrastructure.",
    sourceAgentName: "Market Intelligence Agent",
    sourceTaskId: "task-03",
    externalProviderId: "okx.ai/vendor/intel-01",
    confidence: 0.98,
    verificationStatus: "VERIFIED",
    tags: "market, tam, projections",
    createdAt: "Yesterday",
  },
  {
    id: "mem-4",
    type: "INSIGHT",
    folder: "insights",
    title: "High Conversion Copy Angles",
    content: "Headlines focusing on 'autonomous company operations' converted 3.2x better than generic 'AI assistant' framing. Retain 'Build. Delegate. Scale.' as primary brand proposition.",
    sourceAgentName: "Marketing Agent",
    sourceTaskId: "task-04",
    externalProviderId: null,
    confidence: 0.89,
    verificationStatus: "VERIFIED",
    tags: "copy, marketing, conversion",
    createdAt: "2 days ago",
  },
];

const TABS = ["All", "Research", "Strategies", "Reports", "Ideas", "Insights"];

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryRow[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MemoryRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.items && d.items.length > 0) ? d.items : DEFAULT_MEMORIES;
        setItems(list);
        setSelected(list[0] ?? null);
      })
      .catch(() => {
        setItems(DEFAULT_MEMORIES);
        setSelected(DEFAULT_MEMORIES[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let res = items;
    if (activeTab !== "All") {
      res = res.filter((i) => i.folder.toLowerCase() === activeTab.toLowerCase() || i.type.toLowerCase() === activeTab.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter((r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q) || r.tags.toLowerCase().includes(q));
    }
    return res;
  }, [items, activeTab, search]);

  return (
    <main className="flex-1 bg-[#EEF5F6] flex flex-col overflow-y-auto">
      {/* Top Hero Pixel Art Banner */}
      <section
        className="relative h-36 w-full overflow-hidden border-b border-[#cbdcd8] shrink-0 flex items-center justify-between px-8"
        style={{
          backgroundImage: `url('/banners/forest.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/70 via-sky-900/30 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-md">
            Company Memory
          </h2>
          <p className="text-xs lg:text-sm font-semibold text-emerald-100 mt-0.5 drop-shadow-sm">
            Your team's collective intelligence and compounding knowledge.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-amber-100 relative z-10">
          <span className="text-cyan-600 font-bold">✦</span>
          <div className="text-xs text-slate-700 font-medium">
            <span className="font-bold text-slate-900">“Knowledge today.</span> Better decisions tomorrow.”
          </div>
        </div>
      </section>

      {/* Controls & Filter Bar */}
      <section className="p-4 lg:p-6 pb-2">
        <div className="flex flex-wrap items-center gap-3 justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          {/* Search Input */}
          <div className="flex-1 min-w-[260px] relative">
            <input
              className="w-full pl-4 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 font-medium"
              placeholder="Search company memory (e.g. market research, strategies, reports...)"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Add to Memory Button */}
          <button
            type="button"
            className="px-4 py-2 bg-[#026551] hover:bg-[#037861] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>+ Add to Memory</span>
          </button>
        </div>
      </section>

      {/* Content Grid (2 Columns) */}
      <section className="p-4 lg:p-6 pt-3 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start flex-1">
        {/* Left Column: Knowledge Library Cards (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2.5">
              Knowledge Library
            </h3>
            {/* Filter Pill Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                    activeTab === t
                      ? "bg-[#006951] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading memory library...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No memories found matching your search.
              </div>
            ) : (
              filtered.map((m) => {
                const isSelected = selected?.id === m.id;
                return (
                  <article
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`p-3.5 rounded-xl transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-white border-2 border-emerald-600 shadow-md ring-1 ring-emerald-500"
                        : "bg-white border border-slate-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">
                        📄
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{m.title}</h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{m.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>{m.sourceAgentName || "Internal"}</span>
                          <span>•</span>
                          <span>{m.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      ✓ {m.verificationStatus}
                    </span>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Memory Detail (5 cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          {selected ? (
            <>
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    {selected.type}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Confidence: {Math.round(selected.confidence * 100)}%
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                  {selected.title}
                </h3>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Content</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                  {selected.content}
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source Agent:</span>
                  <span className="font-bold text-slate-900">{selected.sourceAgentName || "Founder"}</span>
                </div>
                {selected.externalProviderId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">External Provider:</span>
                    <span className="font-bold text-teal-700">{selected.externalProviderId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification:</span>
                  <span className="font-bold text-emerald-600">{selected.verificationStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tags:</span>
                  <span className="font-medium text-slate-600">{selected.tags}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">Select an item to view memory record</div>
          )}
        </div>
      </section>
    </main>
  );
}
