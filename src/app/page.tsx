"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { AgentGraph } from "@/components/AgentGraph";
import { AgentSprite } from "@/components/PixelSprite";
import { LiveActivity } from "@/components/LiveActivity";

interface Mission {
  id: string;
  objective: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  status: string;
  spendCents: number;
}

interface CompanyData {
  company: {
    id: string;
    name: string;
    mission: string | null;
    autonomyPolicy: string;
    budgetCents?: number;
  };
  missions: Mission[];
  agentCount?: number;
  externalCount?: number;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  type: string;
  status: string;
  taskCount: number;
  successRate: number;
  externalProviderId: string | null;
}

interface TaskRow {
  id: string;
  objective: string;
  role: string;
  status: string;
  isOutsourced: boolean;
}

// Role → status label + 8-bit sprite, mirroring the Stitch home design.
const ROLE_META: Record<string, { label: string }> = {
  CEO: { label: "Planning" },
  STRATEGY: { label: "Strategy" },
  RESEARCH: { label: "Research" },
  MARKETING: { label: "Marketing" },
  VERIFICATION: { label: "Quality" },
  PRODUCT: { label: "Product" },
};

const ROLE_ORDER = ["CEO", "STRATEGY", "RESEARCH", "PRODUCT", "MARKETING", "VERIFICATION"];

function HomeInner() {
  const params = useSearchParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [taskRows, setTaskRows] = useState<TaskRow[]>([]);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/companies");
        if (!res.ok) return;
        const data = (await res.json()) as CompanyData | { company: null };
        if (!("company" in data) || !data.company) return; // fresh → /onboarding
        setCompany(data);
        const [w, a] = await Promise.all([
          fetch(`/api/wallet?companyId=${data.company.id}`),
          fetch(`/api/agents?companyId=${data.company.id}`),
        ]);
        if (w.ok) {
          const wj = (await w.json()) as { wallet?: { availableCents?: number } };
          setBalanceCents(wj.wallet?.availableCents ?? null);
        }
        if (a.ok) {
          const aj = (await a.json()) as { agents?: Agent[] };
          setAgents(aj.agents ?? []);
        }
        // Tasks drive the Executions counter and the mission checklist.
        const t = await fetch(`/api/tasks?companyId=${data.company.id}`);
        if (t.ok) {
          const tj = (await t.json()) as { tasks?: TaskRow[] };
          setTaskRows(tj.tasks ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Poll treasury while running
  useEffect(() => {
    if (!company) return;
    const id = setInterval(async () => {
      try {
        const w = await fetch(`/api/wallet?companyId=${company.company.id}`);
        if (!w.ok) return;
        const wj = (await w.json()) as { wallet?: { availableCents?: number } };
        setBalanceCents(wj.wallet?.availableCents ?? null);
      } catch {
        /* noop */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [company]);

  // Honest demo/live rail label from the public config endpoint.
  const [rail, setRail] = useState<{ demoMode: boolean; network: string } | null>(null);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setRail(d))
      .catch(() => setRail(null));
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-72px)] grid place-items-center bg-[#fffdf6]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl animate-bounce">🌲</span>
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            Loading your company...
          </span>
        </div>
      </div>
    );
  }

  if (!company) {
    // Fresh start (spec §1): no company yet → the Welcome screen IS the app.
    return <FreshStartRedirect />;
  }

  const missions = company.missions ?? [];
  const activeMission = missions.find((m) => m.status === "ACTIVE") ?? missions[0];
  const internals = agents.filter((a) => a.type === "INTERNAL");
  const externals = agents.filter((a) => a.type === "EXTERNAL");
  const balance = balanceCents === null ? 0 : balanceCents / 100;
  const missionSpend = ((activeMission?.spendCents ?? 0) / 100);
  // All dashboard numbers derive from real rows — no invented fallbacks.
  const totalTasks = activeMission?.totalTasks ?? 0;
  const completedTasks = activeMission?.completedTasks ?? 0;
  const progressPct = activeMission?.progress ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  // Executions = tasks that have actually been worked (delivered or beyond).
  const executions = taskRows.filter((t) => ["DELIVERED", "VERIFYING", "VERIFIED", "PAID", "COMPLETED"].includes(t.status)).length;
  // Time-aware greeting.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const founderName = "Khushi";
  // Team roster for the Agent Team strip — internal agents in spec role order.
  const roster = [...internals].sort((a, b) => {
    const ia = ROLE_ORDER.indexOf(a.role); const ib = ROLE_ORDER.indexOf(b.role);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
  });
  // Mission checklist = the real task rows (newest first, capped like the design's six items).
  const missionTasks = taskRows.slice(0, 6);

  return (
    <div className="flex-1 flex flex-col bg-[#fdfbf4] min-w-0">
      {/* Top Hero Pixel Forest Banner */}
      <header
        className="relative w-full h-44 bg-cover bg-center overflow-hidden flex items-center justify-between px-6 lg:px-8 border-b border-[#e1decf] shrink-0"
        data-purpose="banner-header"
        style={{
          // Self-hosted copy of the Stitch "3. Home Dashboard" banner asset.
          backgroundImage: `url('/banners/forest.png')`,
        }}
      >
        {/* Overlay tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-100/90 via-white/50 to-transparent pointer-events-none" />

        {/* Greeting Text Area — white + drop shadow: the design places the
            headline over a bright sky part of the banner, where the original
            dark-navy text was invisible. */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]">
            {greeting}, {founderName}
          </h1>
          <p className="text-white/95 text-xs lg:text-sm font-semibold mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            Your autonomous AI company is up and running.
          </p>
        </div>

        {/* Top Right Indicators & Quote */}
        <div className="relative z-10 hidden sm:flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2">
            {/* Day / Weather */}
            <div className="bg-[#002224]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#145053] text-white flex items-center gap-2 text-xs font-semibold shadow">
              <span className="text-amber-400 text-sm">☀️</span>
              <span>Day {new Date().getDate()} • Clear</span>
            </div>
            {/* Wallet USDT */}
            <Link
              href="/wallet"
              className="bg-[#002224]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#145053] text-white flex items-center gap-2 text-xs font-semibold shadow hover:bg-[#043336] transition-colors"
            >
              <span className="text-emerald-400 text-sm">🪙</span>
              <span>{balance.toFixed(2)} USDT</span>
            </Link>
            {/* Notification Bell */}
            <div className="bg-[#002224]/85 backdrop-blur-md w-8 h-8 rounded-lg border border-[#145053] text-white flex items-center justify-center relative shadow">
              <span className="text-xs">🔔</span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                1
              </span>
            </div>
            {/* User Mini Icon */}
            <div className="w-8 h-8 rounded-lg bg-[#002224]/85 border border-[#145053] flex items-center justify-center text-sm shadow">
              <span>👧🏻</span>
            </div>
          </div>

          {/* Quote Tag */}
          <div className="bg-[#fefbf0]/95 border border-[#cfb57a] rounded-lg px-3.5 py-1.5 flex items-center gap-2 shadow-sm text-xs font-medium text-[#1c385b]">
            <span className="text-indigo-500 font-bold text-sm">✦</span>
            <span>“Autonomous teams build progress.”</span>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* Company Overview Card */}
        <section
          className="bg-white rounded-2xl border border-[#e6e2d3] p-5 shadow-sm"
          data-purpose="company-overview-stats"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left: Company Identity & Progress */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#002324] flex items-center justify-center border border-[#115a5d] text-2xl shadow">
                    ⛰️
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {company.company.name}
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      {company.company.mission || "Turn big goals into scalable outcomes"}
                    </p>
                  </div>
                </div>
                {/* Status Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e3f7ec] text-[#0d8253] border border-[#a2e0c0]">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  {activeMission?.status === "COMPLETED" ? "Completed" : "In Progress"}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-[#e8eceb] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0b806d] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mt-2">
                  <span className="text-[#0b806d]">{progressPct}%</span>
                  <span>{completedTasks}/{totalTasks} tasks</span>
                </div>
              </div>
            </div>

            {/* Right: Metric Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0">
              {/* Active Agents */}
              <div className="bg-[#fcfbf7] border border-[#ece8db] rounded-xl px-4 py-3 text-center min-w-[105px]">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#004e92] text-white flex items-center justify-center text-xs font-bold mb-1 shadow-sm">
                  {internals.length}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Active Agents</div>
              </div>
              {/* External Agents */}
              <div className="bg-[#fcfbf7] border border-[#ece8db] rounded-xl px-4 py-3 text-center min-w-[105px]">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#0275d8] text-white flex items-center justify-center text-xs font-bold mb-1 shadow-sm">
                  {company.externalCount ?? externals.length}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">External Agents</div>
              </div>
              {/* Executions */}
              <div className="bg-[#fcfbf7] border border-[#ece8db] rounded-xl px-4 py-3 text-center min-w-[105px]">
                <div className="w-7 h-7 mx-auto rounded-full bg-[#205493] text-white flex items-center justify-center text-xs font-bold mb-1 shadow-sm">
                  {executions}
                </div>
                <div className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Executions</div>
              </div>
              {/* Total Spent */}
              <div className="bg-[#fcfbf7] border border-[#ece8db] rounded-xl px-4 py-3 text-center min-w-[115px]">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-amber-500 text-sm">🪙</span>
                  <span className="text-xs font-black text-slate-800">{missionSpend.toFixed(2)} USDT</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">Total Spent</div>
              </div>
            </div>
          </div>
        </section>

        {/* OKX AI rail strip — which settlement rail is actually active */}
        <section
          className="bg-[#022f30] rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
          data-purpose="okx-rail-strip"
        >
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-400/15 border border-emerald-300/30 flex items-center justify-center text-lg">
              ⛓️
            </span>
            <div>
              <div className="text-xs font-black text-white tracking-tight">
                Powered by OKX AI — Agent Payments Protocol (x402)
              </div>
              <div className="text-[11px] text-emerald-200/90">
                ASP discovery via A2A/A2MCP · settlements in USD₮0 on X Layer testnet
              </div>
            </div>
          </div>
          <span
            className={`text-[10px] font-black px-3 py-1.5 rounded-full border shrink-0 ${
              rail && !rail.demoMode
                ? "bg-emerald-400 text-emerald-950 border-emerald-300"
                : "bg-white/10 text-emerald-100 border-emerald-300/30"
            }`}
          >
            {rail ? (rail.demoMode ? "DEMO RAIL · simulated txs, honestly labeled" : "LIVE RAIL · real onchain txs") : "OKX X LAYER TESTNET"}
          </span>
        </section>

        {/* Split Section: Team + Activity vs Current Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Agent Team + Activity Feed */}
          <div className="lg:col-span-8 space-y-6">
            {/* Your Agent Team */}
            <section data-purpose="agent-team-list">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-slate-900">Your Agent Team</h3>
                <Link href="/agents" className="text-xs font-bold text-[#0b806d] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {roster.length === 0 && (
                  <div className="col-span-2 sm:col-span-5 text-xs text-slate-400 py-4 text-center">
                    No agents yet — assemble your company to staff the team.
                  </div>
                )}
                {roster.map((a) => {
                  const meta = ROLE_META[a.role] ?? { label: a.role.charAt(0) + a.role.slice(1).toLowerCase(), sprite: "🤖" };
                  return (
                    <div
                      key={a.id}
                      className="bg-white border border-[#eae6d8] rounded-xl p-3 flex flex-col items-center text-center shadow-sm hover:border-emerald-400 transition-all"
                    >
                      <div className="w-10 h-10 mb-1.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <AgentSprite role={a.role} size={22} className="text-emerald-700" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 mb-1.5 truncate w-full">{a.name}</div>
                      <span className="px-2 py-0.5 rounded-md bg-[#e3f2fd] text-[#1976d2] font-semibold text-[10px]">
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Live Agent Graph (Interactive Network) */}
            <section className="bg-white border border-[#eae6d8] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🕸️</span> Live Agent Network & Autonomous Delegations
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Synced
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 mb-2">
                Hover any agent to see what it&apos;s working on right now — click to pin.
              </p>
              <AgentGraph companyId={company.company.id} />
            </section>

            {/* Recent Activity Feed */}
            <section data-purpose="recent-activity-feed">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-extrabold text-slate-900">Recent Activity</h3>
                <span className="text-[11px] font-medium text-slate-400">SSE Realtime</span>
              </div>
              <div className="bg-white border border-[#eae6d8] rounded-2xl p-4 divide-y divide-slate-100 shadow-sm max-h-72 overflow-y-auto">
                <LiveActivity companyId={company.company.id} />
              </div>
            </section>
          </div>

          {/* Right Column (4 cols): Missions & Promo Card */}
          <div className="lg:col-span-4 space-y-6">
            {/* Current Mission Card */}
            <section
              className="bg-white border border-[#eae6d8] rounded-2xl p-5 shadow-sm"
              data-purpose="current-mission-tracker"
            >
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Current Mission
              </h3>
              <h4 className="text-sm font-extrabold text-slate-900 leading-snug mb-4">
                {activeMission?.objective || "No active mission yet"}
              </h4>

              {/* Task checklist — real task rows; overall progress per the mission row */}
              {missionTasks.length === 0 ? (
                <div className="text-xs text-slate-400 py-3">No tasks yet — the CEO plans them once the mission starts.</div>
              ) : (
                <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                  {missionTasks.map((t) => {
                    const done = ["VERIFIED", "PAID", "COMPLETED"].includes(t.status);
                    const working = t.status === "EXECUTING" || t.status === "ASSIGNED";
                    const pct = done ? 100 : working ? 45 : 0;
                    return (
                      <div key={t.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {done ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : working ? (
                            <span className="text-amber-500 font-bold">⏳</span>
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 block shrink-0" />
                          )}
                          <span className={`${done ? "text-slate-800" : "text-slate-700"} truncate`}>{t.objective}</span>
                        </div>
                        <div className="w-16 bg-[#e5e9e7] h-2 rounded-full overflow-hidden shrink-0">
                          <div className="bg-[#0b806d] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Bottom Motivational Promo Card */}
            <section
              className="bg-gradient-to-br from-[#f8faf8] to-[#fffdf5] border border-[#cfb57a] rounded-2xl p-4 shadow-sm relative overflow-hidden"
              data-purpose="promo-card"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-emerald-100/60 rounded-xl border border-emerald-200 text-3xl shadow-sm">
                  🤖
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-slate-800 leading-tight">
                    Small steps today, big outcomes tomorrow.
                  </p>
                  <Link
                    href="/missions"
                    className="px-3 py-1.5 rounded-lg bg-[#0e7c6b] hover:bg-[#0a6657] text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow"
                  >
                    <span>Create New Mission</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center font-pixel text-xs text-slate-400">
          Loading dashboard...
        </div>
      }
    >
      <HomeInner />
    </Suspense>
  );
}

/** Fresh workspace (no company) → the Welcome screen is the app's front door. */
function FreshStartRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding");
  }, []);
  return (
    <div className="h-[calc(100vh-72px)] grid place-items-center bg-[#fffdf6]">
      <div className="flex flex-col items-center gap-3">
        <span className="text-3xl animate-bounce">🌲</span>
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          Welcome — setting things up…
        </span>
      </div>
    </div>
  );
}
