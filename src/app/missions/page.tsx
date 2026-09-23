"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Mission {
  id: string;
  objective: string;
  status: string;
  priority: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  spendCents: number;
}

interface TaskRow {
  id: string;
  missionId: string;
  objective: string;
  role: string;
  status: string;
  isOutsourced: boolean;
  externalProviderId: string | null;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [taskRows, setTaskRows] = useState<TaskRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"ACTIVE" | "COMPLETED" | "DRAFT">("ACTIVE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/missions"), fetch("/api/tasks")])
      .then(([r, t]) => Promise.all([r.json(), t.json()]))
      .then(([d, tj]) => {
        const ms: Mission[] = d.missions ?? [];
        setMissions(ms);
        setTaskRows(tj.tasks ?? []);
        if (ms.length > 0) setSelectedId(ms[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCount = missions.filter((m) => m.status === "ACTIVE").length;
  const completedCount = missions.filter((m) => m.status === "COMPLETED").length;
  const draftCount = missions.filter((m) => m.status === "DRAFT").length;

  const shown = missions.filter((m) => (tab === "DRAFT" ? m.status === "DRAFT" : m.status === tab));
  const selectedMission = missions.find((m) => m.id === selectedId) ?? shown[0];
  const selectedMissionTasks = taskRows.filter((t) => t.missionId === selectedMission?.id);

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-[#fdfbf2]" data-purpose="missions-dashboard-content">
      {/* Top Hero Banner */}
      <section
        className="relative h-32 w-full overflow-hidden border-b border-[#e2dec9] shrink-0"
        data-purpose="banner-header"
      >
        <img
          alt="Pixel forest banner"
          className="w-full h-full object-cover object-center brightness-105"
          src="/banners/forest.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/70 via-transparent to-transparent flex items-center justify-between px-6">
          <div className="flex items-center gap-3 drop-shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-100/90 border border-amber-300 p-1 flex items-center justify-center shadow text-xl">
              🏛️
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                Missions
              </h1>
              <p className="text-xs text-emerald-100 font-medium drop-shadow">
                Turn big goals into achievable outcomes.
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white/95 px-4 py-2 rounded-xl border border-slate-200/90 shadow-sm backdrop-blur-sm">
            <span className="text-sky-500 font-bold text-xs">✦</span>
            <p className="text-xs font-semibold text-slate-700">
              "Big goals. Smaller steps. Real outcomes."
            </p>
          </div>
        </div>
      </section>

      {/* Tab & Actions Bar */}
      <div className="p-6 pb-2 flex flex-wrap items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center bg-[#eae5d5] p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1 border border-[#dfd9c6]">
          <button
            onClick={() => setTab("ACTIVE")}
            className={`px-4 py-1.5 rounded-lg transition ${
              tab === "ACTIVE"
                ? "bg-white text-[#004f43] font-bold border border-emerald-700/20 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setTab("COMPLETED")}
            className={`px-4 py-1.5 rounded-lg transition ${
              tab === "COMPLETED"
                ? "bg-white text-[#004f43] font-bold border border-emerald-700/20 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setTab("DRAFT")}
            className={`px-4 py-1.5 rounded-lg transition ${
              tab === "DRAFT"
                ? "bg-white text-[#004f43] font-bold border border-emerald-700/20 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Draft ({draftCount})
          </button>
        </div>

        {/* Add Mission Button */}
        <Link
          href="/create"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006050] hover:bg-[#004d40] text-white text-xs font-bold transition shadow-sm border border-[#004d40]"
        >
          <span>+</span>
          <span>New Mission</span>
        </Link>
      </div>

      {/* Mission Columns Layout */}
      <div className="p-6 pt-3 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* Column 1: Mission List (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {loading ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">Loading missions...</div>
          ) : shown.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-2">
              <span className="text-3xl">🚩</span>
              <div className="text-sm font-bold text-slate-700">No {tab.toLowerCase()} missions found</div>
              <p className="text-xs text-slate-500">Create a new mission to get autonomous agents working.</p>
            </div>
          ) : (
            shown.map((m) => {
              const isSelected = m.id === selectedId;
              return (
                <article
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`p-4 rounded-xl transition cursor-pointer relative ${
                    isSelected
                      ? "bg-white border-2 border-emerald-600/60 shadow-md ring-1 ring-emerald-500"
                      : "bg-white/80 border border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <h2 className="text-sm font-extrabold text-[#002f29]">
                      {m.objective}
                    </h2>
                    <Link
                      href={`/missions/${m.id}`}
                      className="text-[11px] font-bold text-[#006050] hover:underline shrink-0"
                    >
                      Detail →
                    </Link>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border text-[10px] ${
                        m.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}
                    >
                      {m.status === "COMPLETED" ? "Completed" : "In Progress"}
                    </span>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                        {m.completedTasks}/{m.totalTasks} tasks
                      </span>
                    </div>

                    {/* Priority Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border text-[10px] ${
                        m.priority === "HIGH"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {m.priority === "HIGH" ? "🔥 High" : "🚩 Medium"}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Column 2: Selected Mission Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#dfd9c6] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Task Breakdown
            </span>
            <h3 className="text-sm font-black text-slate-900 mt-1 leading-snug">
              {selectedMission?.objective || "Mission Plan & Milestones"}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {(selectedMissionTasks.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-center">
                No tasks yet — the CEO breaks this mission down when it starts.
              </div>
            )) ||
              selectedMissionTasks.map((t, i) => {
                const done = ["VERIFIED", "PAID", "COMPLETED"].includes(t.status);
                const running = t.status === "EXECUTING";
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 font-bold ${done ? "text-emerald-600" : running ? "text-amber-500" : "text-slate-300"}`}>
                        {done ? "✓" : running ? "⏳" : "○"}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{i + 1}. {t.objective}</div>
                        <div className="text-[11px] text-slate-500">
                          {t.isOutsourced
                            ? `Outsourced to ${t.externalProviderId ?? "marketplace ASP"}`
                            : `Assigned to ${t.role.toLowerCase()} agent`} · {t.status.toLowerCase().replaceAll("_", " ")}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        done
                          ? "bg-emerald-100 text-emerald-800"
                          : running
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {done ? "Done" : running ? "Active" : "Queued"}
                    </span>
                  </div>
                );
              })}
          </div>

          {selectedMission && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Mission Spend:</span>
              <span className="font-bold text-slate-900">
                {((selectedMission.spendCents ?? 0) / 100).toFixed(2)} USDT
              </span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
