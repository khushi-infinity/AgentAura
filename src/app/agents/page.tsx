"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AgentSprite } from "@/components/PixelSprite";

interface AgentRow {
  id: string;
  name: string;
  role: string;
  type: string;
  avatar: string;
  description: string;
  status: string;
  taskCount: number;
  successRate: number;
  externalProviderId: string | null;
}

// Role → badge label + sprite glyph, mirroring the Stitch "5. Agents" design.
const ROLE_META: Record<string, { label: string }> = {
  CEO: { label: "Planning" },
  STRATEGY: { label: "Strategy" },
  RESEARCH: { label: "Research" },
  MARKETING: { label: "Marketing" },
  VERIFICATION: { label: "Quality" },
  PRODUCT: { label: "Product" },
  EXTERNAL: { label: "External" },
};

function labelFor(a: AgentRow) {
  if (a.type === "EXTERNAL") return ROLE_META.EXTERNAL.label;
  return ROLE_META[a.role]?.label ?? a.role.charAt(0) + a.role.slice(1).toLowerCase();
}

function spriteRoleFor(a: AgentRow) {
  return a.type === "EXTERNAL" ? "EXTERNAL" : a.role;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [externals, setExternals] = useState<AgentRow[]>([]);
  const [tab, setTab] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents ?? []);
        setExternals(d.externalProviders ?? []);
      })
      .catch(() => {
        setAgents([]);
        setExternals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const allItems = tab === "INTERNAL" ? agents : externals;
  const filtered = allItems.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 bg-[#F9FAFB] p-4 md:p-5 flex flex-col gap-4 overflow-y-auto" data-purpose="main-dashboard-canvas">
      {/* Top Pixel Hero Banner */}
      <section
        className="relative w-full h-[145px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0"
        data-purpose="hero-banner"
      >
        <img
          alt="Pixel Forest Landscape"
          className="w-full h-full object-cover object-center pixelated select-none"
          src="/banners/forest.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent flex items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white/95 backdrop-blur-sm border border-emerald-300 p-1 flex items-center justify-center shadow-lg text-3xl">
              🤖
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
                Agents
              </h2>
              <p className="text-xs lg:text-sm font-semibold text-slate-700">
                Build the dream team of AI agents.
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-md border border-slate-200">
            <span className="text-cyan-600 font-bold">✦</span>
            <span className="text-xs md:text-sm font-bold text-slate-800 tracking-wide">
              "Specialized agents. Extraordinary results."
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Action Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3" data-purpose="toolbar">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("INTERNAL")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition shadow-sm ${
              tab === "INTERNAL"
                ? "bg-white border-2 border-slate-800 text-slate-900"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
            }`}
          >
            Company Agents <span className="text-slate-500 font-medium">({agents.length})</span>
          </button>
          <button
            onClick={() => setTab("EXTERNAL")}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition shadow-sm ${
              tab === "EXTERNAL"
                ? "bg-white border-2 border-slate-800 text-slate-900"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
            }`}
          >
            External Agents <span className="text-slate-500 font-medium">({externals.length})</span>
          </button>
        </div>

        {/* Search Bar and Action Buttons */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl justify-end">
          <div className="relative w-full">
            <input
              className="w-full pl-4 pr-4 py-2 text-xs md:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 shadow-sm font-medium"
              placeholder="Search agents, skills, or roles..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link
            href="/marketplace"
            className="px-4 py-2 bg-[#006644] hover:bg-[#005237] text-white text-xs md:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
          >
            <span className="text-base font-extrabold leading-none">+</span>
            <span>Hire Agent</span>
          </Link>
        </div>
      </section>

      {/* Agents Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs font-semibold text-slate-400">Loading agents…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <AgentSprite role={tab === "EXTERNAL" ? "EXTERNAL" : "agents"} size={40} className="text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">
            {tab === "EXTERNAL" ? "No external agents hired yet" : "No agents yet"}
          </div>
          <p className="text-xs text-slate-500">
            {tab === "EXTERNAL"
              ? "When a mission needs outside help, hired ASPs from the OKX.AI marketplace appear here."
              : "Assemble your company to staff the founding agent team."}
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
        {filtered.map((ag) => (
          <div
            key={ag.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            data-purpose="agent-card"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
                  <AgentSprite role={spriteRoleFor(ag)} size={26} className="text-emerald-700" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#e3f2fd] text-[#1976d2] whitespace-nowrap">
                  {labelFor(ag)}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 mt-2.5 text-sm leading-snug truncate">
                {ag.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                {ag.description}
              </p>

              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    ag.status === "ACTIVE" || ag.status === "HIRED"
                      ? "bg-[#E3FCEF] text-[#006644]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ag.status === "ACTIVE" || ag.status === "HIRED" ? "bg-[#006644]" : "bg-slate-400"
                    }`}
                  />
                  {ag.status.charAt(0) + ag.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div>
                <span className="font-bold text-slate-900">{ag.taskCount}</span> tasks
              </div>
              <div>
                <span className="font-bold text-emerald-600">{ag.successRate}%</span> success
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </main>
  );
}
