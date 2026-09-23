"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MissionData {
  mission: {
    id: string;
    objective: string;
    status: string;
    completedTasks: number;
    totalTasks: number;
    spendCents: number;
    progress: number;
  };
  tasks: { id: string; isOutsourced: boolean; status: string }[];
}

export default function SuccessPage() {
  const [data, setData] = useState<MissionData | null>(null);
  const [agents, setAgents] = useState<{ type: string }[]>([]);
  const [externalCount, setExternalCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((d) => {
        const ms = d.missions ?? [];
        const completed = ms.find((m: { status: string }) => m.status === "COMPLETED") || ms[0];
        if (completed) {
          setData({
            mission: completed,
            tasks: [],
          });
        }
      })
      .catch(() => {});
    // Derive team metrics from real rows — never hardcode counts.
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setExternalCount(d?.externalCount ?? null);
        const cid = d?.company?.id;
        if (!cid) return;
        return fetch(`/api/agents?companyId=${cid}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((a) => setAgents(a?.agents ?? []));
      })
      .catch(() => {});
  }, []);

  const objective = data?.mission.objective || "Your mission is awaiting its first run";
  const tasksCompleted = data?.mission.completedTasks ?? 0;
  const totalTasks = data?.mission.totalTasks ?? 0;
  const spend = ((data?.mission.spendCents ?? 0) / 100).toFixed(2);
  const involved = agents.filter((a) => a.type === "INTERNAL").length;
  const externals = externalCount ?? agents.filter((a) => a.type === "EXTERNAL").length;
  const verifiedPct = data?.mission.status === "COMPLETED" ? "100%" : `${data?.mission.progress ?? 0}%`;

  return (
    <main
      className="flex-1 relative flex flex-col justify-between overflow-hidden bg-cover bg-center min-h-[850px]"
      data-purpose="content-display"
      style={{
        backgroundImage: `url('/banners/forest.png')`,
      }}
    >
      {/* Top Floating Content: Signboard & Quote */}
      <div className="relative z-10 w-full px-6 pt-6 flex items-start justify-between">
        <div className="hidden md:block w-48" />

        {/* Central Wooden Signboard */}
        <div
          className="mx-auto bg-[#ffeed0] px-8 py-4 rounded-xl text-center shadow-2xl relative border-4 border-[#8b4513]"
          data-purpose="mission-complete-signboard"
        >
          <div className="absolute -top-3.5 left-2 text-emerald-600 text-lg select-none">🍃</div>
          <div className="absolute -top-3.5 right-2 text-emerald-600 text-lg select-none">🌿</div>
          <h1 className="text-[#102d4e] font-black text-xl sm:text-2xl tracking-wide uppercase drop-shadow-xs">
            MISSION COMPLETE!
          </h1>
          <p className="text-[#2b4429] font-bold text-xs sm:text-sm mt-1 tracking-tight">
            {objective}
          </p>
        </div>

        {/* Top-Right Speech Quote Bubble */}
        <div className="hidden sm:block bg-white border border-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl shadow-lg text-xs md:text-sm tracking-tight self-start">
          “From idea to impact. Together.”
        </div>
      </div>

      {/* Spacer to admire the pixel art robots */}
      <div className="flex-1 min-h-[160px]" />

      {/* Bottom Summary Dashboard & Actions */}
      <div className="relative z-10 w-full px-4 sm:px-8 pb-6 flex flex-col items-center gap-4">
        {/* Metric Summary Bar Card */}
        <section
          className="w-full max-w-5xl bg-[#fdfbf6]/95 backdrop-blur-md rounded-2xl border-2 border-[#e6dbc8] shadow-2xl p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 divide-y sm:divide-y-0 md:divide-x divide-stone-200"
          data-purpose="metrics-summary-bar"
        >
          {/* Metric 1: Tasks Completed — derived from mission rows, never hardcoded */}
          <div className="flex items-center gap-2.5 px-2 py-1 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white shadow text-sm shrink-0">
              ✓
            </div>
            <div>
              <div className="text-base font-extrabold text-[#112d38] leading-none">{tasksCompleted}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-0.5">Tasks Completed</div>
            </div>
          </div>

          {/* Metric 2: Agents Involved — derived from agent rows */}
          <div className="flex items-center gap-2.5 px-2 py-1 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-full bg-[#0284c7] flex items-center justify-center text-white shadow text-sm shrink-0">
              🤖
            </div>
            <div>
              <div className="text-base font-extrabold text-[#112d38] leading-none">{involved}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-0.5">Involved</div>
            </div>
          </div>

          {/* Metric 3: External Agents — derived, never hardcoded */}
          <div className="flex items-center gap-2.5 px-2 py-1 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white shadow text-sm shrink-0">
              ⚡
            </div>
            <div>
              <div className="text-base font-extrabold text-[#112d38] leading-none">{externals}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-0.5">External Agents</div>
            </div>
          </div>

          {/* Metric 2: Executions — completed of total */}
          <div className="flex items-center gap-2.5 px-2 py-1 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center text-white shadow text-sm shrink-0">
              ⚙️
            </div>
            <div>
              <div className="text-base font-extrabold text-[#112d38] leading-none">{totalTasks}</div>
              <div className="text-[10px] font-bold text-stone-500 mt-0.5">Executions</div>
            </div>
          </div>

          {/* Metric 5: Total Spent */}
          <div className="flex items-center gap-2.5 px-2 py-1 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-full bg-[#eab308] border border-amber-600 flex items-center justify-center text-amber-950 font-bold text-xs shadow shrink-0">
              $
            </div>
            <div>
              <div className="text-base font-extrabold text-[#112d38] leading-none">{spend} USDT</div>
              <div className="text-[10px] font-bold text-stone-500 mt-0.5">Total Spent</div>
            </div>
          </div>

          {/* Metric 6: Verification Rate — from mission state */}
          <div className="flex items-center gap-2.5 px-2 py-1 justify-center sm:justify-start">
            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white shadow text-xs font-bold shrink-0">
              {verifiedPct}
            </div>
            <div>
              <div className="text-base font-extrabold text-[#112d38] leading-none">Verified</div>
              <div className="text-[10px] font-bold text-stone-500 mt-0.5">OKX Onchain</div>
            </div>
          </div>
        </section>

        {/* Action Buttons — labels from the Stitch design (12. Final Success View) */}
          <div className="flex items-center gap-3">
            <Link
              href={`/missions/${data?.mission.id ?? ""}`}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow transition"
            >
              View Report
            </Link>
            <Link
              href="/create"
              className="px-5 py-2.5 bg-[#057a55] hover:bg-[#046c4e] text-white text-xs font-bold rounded-xl shadow transition"
            >
              Start New Mission
            </Link>
          </div>
      </div>
    </main>
  );
}
