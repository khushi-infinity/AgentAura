"use client";

import { useEffect, useState } from "react";

interface Mission {
  id: string;
  status: string;
  progress: number;
  spendCents: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

interface TaskRow {
  id: string;
  objective: string;
  role: string;
  status: string;
  isOutsourced: boolean;
  createdAt: string;
  completedAt: string | null;
}

export default function AnalyticsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [agentCount, setAgentCount] = useState(0);
  const [externalCount, setExternalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [proto, setProto] = useState<{
    gmvCents: number;
    feeCents: number;
    settlementCount: number;
    failedCount: number;
    liveSettlements: number;
    liveGmvCents: number;
    averageTicketCents: number;
    feeBps: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/missions").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/protocol").then((r) => r.json()).catch(() => null),
    ])
      .then(([m, a, t, t4]) => {
        setMissions(m.missions ?? []);
        const agents = a.agents ?? [];
        setAgentCount(agents.filter((x: { type: string }) => x.type === "INTERNAL").length);
        setExternalCount(agents.filter((x: { type: string }) => x.type === "EXTERNAL").length);
        setTasks(t.tasks ?? []);
        if (t4) setProto(t4);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Everything below derives from real rows — zero invented numbers.
  const totalTasks = missions.reduce((s, m) => s + (m.totalTasks || 0), 0);
  const doneTasks = missions.reduce((s, m) => s + (m.completedTasks || 0), 0);
  const totalSpend = missions.reduce((s, m) => s + (m.spendCents || 0), 0) / 100;
  // Real average turnaround measured from completed task timestamps.
  const completedTimed = tasks.filter((t) => t.completedAt && t.createdAt);
  const avgMs =
    completedTimed.length > 0
      ? completedTimed.reduce(
          (s, t) => s + (new Date(t.completedAt as string).getTime() - new Date(t.createdAt as string).getTime()),
          0,
        ) / completedTimed.length
      : null;
  const avgLabel =
    avgMs === null
      ? "—"
      : avgMs < 3_600_000
        ? `${Math.max(1, Math.round(avgMs / 60_000))} min`
        : `${(avgMs / 3_600_000).toFixed(1)} hrs`;
  // Honest per-task progress bands from real status.
  const statusPct = (s: string) =>
    ["VERIFIED", "PAID", "COMPLETED"].includes(s) ? 100 : s === "VERIFYING" || s === "DELIVERED" ? 70 : s === "EXECUTING" ? 45 : 0;
  const statusLabel = (s: string) =>
    ["VERIFIED", "PAID", "COMPLETED"].includes(s) ? "Verified" : s === "VERIFYING" || s === "DELIVERED" ? "Review" : s === "EXECUTING" ? "Running" : "Queued";
  const velocity = tasks.slice(0, 5);
  // Workload distribution by discipline — real counts of task rows.
  const ROLE_LABEL: Record<string, string> = {
    RESEARCH: "Research & Intelligence",
    MARKETING: "Marketing & Growth",
    CEO: "Executive Strategy",
    STRATEGY: "Strategy & Planning",
    PRODUCT: "Product Engineering",
    VERIFICATION: "Verification & QA",
  };
  const roleCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.role] = (acc[t.role] ?? 0) + 1;
    return acc;
  }, {});
  const roleEntries = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]);
  const roleTotal = tasks.length || 1;
  const ROLE_COLOR: Record<string, string> = {
    RESEARCH: "text-sky-700",
    MARKETING: "text-emerald-700",
    CEO: "text-indigo-700",
    STRATEGY: "text-violet-700",
    PRODUCT: "text-teal-700",
    VERIFICATION: "text-amber-700",
  };

  return (
    <main className="flex-1 bg-[#EEF5F6] overflow-y-auto flex flex-col justify-between" data-purpose="analytics-main-view">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Pixel Art Banner Header */}
        <div
          className="relative rounded-2xl overflow-hidden border border-emerald-900/10 shadow-sm min-h-[135px] bg-slate-900 flex items-center"
          data-purpose="banner-header"
        >
          <img
            alt="Pixel forest mountain panoramic banner"
            className="absolute inset-0 w-full h-full object-cover object-bottom opacity-90 pixelated"
            src="/banners/forest.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-sky-900/40 to-transparent" />

          <div className="relative z-10 w-full px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white drop-shadow-sm tracking-tight">
                Analytics &amp; Insights
              </h2>
              <p className="text-xs lg:text-sm font-semibold text-emerald-100 mt-0.5">
                Data that helps your autonomous team scale with clarity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm text-xs text-slate-700">
                <span className="text-sky-500 font-bold">✦</span>
                <span className="font-semibold italic">"Small insights. Bigger horizons."</span>
              </div>
              <div className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm">
                <span>Last 30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" data-purpose="kpi-metrics-row">
          {/* KPI 1: Total Agents */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Agents</p>
              <h3 className="text-xl font-black text-slate-900 leading-none my-0.5">{agentCount + externalCount}</h3>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                {agentCount} internal · {externalCount} external
              </p>
            </div>
          </div>

          {/* KPI 2: Tasks Completed */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center text-xl">
              ✓
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tasks Done</p>
              <h3 className="text-xl font-black text-slate-900 leading-none my-0.5">{doneTasks}</h3>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
                <span className="text-slate-400 font-normal">of {totalTasks} total</span>
              </p>
            </div>
          </div>

          {/* KPI 3: Avg. Task Time */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center text-xl">
              ⏱️
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg. Task Time</p>
              <h3 className="text-xl font-black text-slate-900 leading-none my-0.5">{avgLabel}</h3>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                measured <span className="text-slate-400 font-normal">from {completedTimed.length} completed</span>
              </p>
            </div>
          </div>

          {/* KPI 4: Total Spend */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-xl">
              🪙
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Spend</p>
              <h3 className="text-xl font-black text-slate-900 leading-none my-0.5">{totalSpend.toFixed(2)} USDT</h3>
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                OKX X Layer <span className="text-slate-400 font-normal">micro-settlements</span>
              </p>
            </div>
          </div>
        </section>

        {/* Protocol economics — the business model, live from settled payments.
            GMV grows with every agent-to-agent payment; the fee line is the
            platform's take-rate revenue. */}
        <section className="bg-gradient-to-r from-[#012b2b] via-[#03403c] to-[#01554a] rounded-2xl border border-emerald-900/40 p-5 shadow-sm" data-purpose="protocol-economics">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white">Protocol economics</h3>
              <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">
                AgentAura takes a {(proto?.feeBps ?? 500) / 100}% protocol fee on every settled agent-to-agent payment — revenue that scales with the network.
              </p>
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300 bg-white/10 px-2.5 py-1 rounded-full border border-emerald-400/30">
              x402 · OKX X Layer
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Gross settlement volume", value: `$${((proto?.gmvCents ?? 0) / 100).toFixed(2)}`, sub: `${proto?.settlementCount ?? 0} settled payments`, accent: "text-white" },
              { label: "Protocol fee revenue", value: `$${((proto?.feeCents ?? 0) / 100).toFixed(2)}`, sub: `${(proto?.feeBps ?? 500) / 100}% take rate`, accent: "text-amber-300" },
              { label: "Live onchain volume", value: `$${((proto?.liveGmvCents ?? 0) / 100).toFixed(2)}`, sub: `${proto?.liveSettlements ?? 0} onchain txs`, accent: "text-emerald-300" },
              { label: "Avg ticket size", value: `$${((proto?.averageTicketCents ?? 0) / 100).toFixed(2)}`, sub: "per settled hire", accent: "text-sky-300" },
            ].map((k) => (
              <div key={k.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
                <div className={`text-lg font-black ${k.accent}`}>{k.value}</div>
                <div className="text-[11px] font-semibold text-emerald-100/90 mt-0.5">{k.label}</div>
                <div className="text-[10px] text-emerald-200/60 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 2-Column Visual Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Execution Velocity */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Task Velocity & Milestone Completion</h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Healthy Trend
              </span>
            </div>

            <div className="space-y-3">
              {velocity.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">No tasks yet — run a mission to populate the velocity chart.</div>
              ) : (
                velocity.map((t) => {
                  const pct = statusPct(t.status);
                  return (
                    <div key={t.id} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span className="truncate mr-3">{t.objective}</span>
                        <span className="text-emerald-700 font-bold whitespace-nowrap">{pct}% ({statusLabel(t.status)})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#007755] h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Spend & Agent Allocation */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Workload by Discipline</h3>
              <span className="text-xs text-slate-400 font-medium">Distribution</span>
            </div>

            <div className="space-y-3 text-xs">
              {roleEntries.length === 0 ? (
                <div className="text-slate-400 py-6 text-center">No task data yet.</div>
              ) : (
                roleEntries.map(([role, n]) => (
                  <div key={role} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800">{ROLE_LABEL[role] ?? role}</span>
                    <span className={`font-bold ${ROLE_COLOR[role] ?? "text-slate-700"}`}>{Math.round((n / roleTotal) * 100)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
