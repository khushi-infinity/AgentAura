"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LiveActivity } from "@/components/LiveActivity";

interface Task {
  id: string;
  objective: string;
  role: string;
  status: string;
  isOutsourced: boolean;
  externalProviderId: string | null;
  spendCents: number;
  budgetCents: number;
}

interface MissionData {
  mission: {
    id: string;
    companyId: string;
    objective: string;
    status: string;
    priority: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
    spendCents: number;
  };
  tasks: Task[];
  deliverables: { id: string; taskId: string; content: string; verificationStatus: string; verificationScore: number }[];
}

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MissionData | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = () =>
      fetch(`/api/missions/${id}`)
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setSelectedTask((cur) => cur ?? d.tasks?.[0]?.id ?? null);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 3500);
    return () => clearInterval(t);
  }, [id]);

  if (!data?.mission) {
    return (
      <div className="p-10 text-center text-xs text-slate-500">
        Loading mission details...
      </div>
    );
  }

  const m = data.mission;
  const task = data.tasks.find((t) => t.id === selectedTask) ?? data.tasks[0];

  return (
    <main className="flex-1 bg-[#FDFBF2] flex flex-col overflow-y-auto">
      {/* Top Banner */}
      <section
        className="relative h-32 w-full overflow-hidden border-b border-[#e2dec9] shrink-0"
        data-purpose="banner-header"
      >
        <img
          alt="Pixel forest banner"
          className="w-full h-full object-cover object-center brightness-105"
          src="/banners/forest.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/75 via-transparent to-transparent flex items-center justify-between px-6">
          <div className="flex items-center gap-3 drop-shadow-md">
            <Link
              href="/missions"
              className="w-9 h-9 rounded-xl bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white transition text-xs font-bold"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight drop-shadow-md">
                {m.objective}
              </h1>
              <p className="text-xs text-emerald-100 font-medium drop-shadow">
                Autonomous Mission Detail &amp; Task Pipeline
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/95 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
            <span>Status:</span>
            <span className="text-emerald-700">{m.status}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="p-6 grid xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Overview & Task List */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wide">Overall Progress</span>
              <span className="font-extrabold text-emerald-700">
                {m.completedTasks}/{m.totalTasks} tasks ({m.progress}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#007755] h-full rounded-full transition-all duration-500"
                style={{ width: `${m.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2.5">
              Task Breakdown
            </h3>

            <div className="space-y-2.5">
              {data.tasks.map((t) => {
                const isSel = selectedTask === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition text-xs flex items-center justify-between ${
                      isSel
                        ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{t.objective}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Role: {t.role} · {t.isOutsourced ? "External Hire" : "Internal Agent"}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "COMPLETED" || t.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "EXECUTING"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Selected Task Inspector & Live Stream */}
        <div className="xl:col-span-5 space-y-4">
          {task && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3.5 text-xs">
              <h3 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                Task Inspector
              </h3>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Objective</span>
                <p className="font-semibold text-slate-800 mt-0.5">{task.objective}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-bold">{task.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Outsourced:</span>
                <span className="font-bold">{task.isOutsourced ? "Yes (OKX.AI Provider)" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Budget / Spend:</span>
                <span className="font-bold text-emerald-700">
                  {((task.spendCents || task.budgetCents || 0) / 100).toFixed(2)} USDT
                </span>
              </div>
            </div>
          )}

          {/* Live Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Live Activity Stream
            </h3>
            <div className="max-h-64 overflow-y-auto">
              <LiveActivity companyId={m.companyId} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
