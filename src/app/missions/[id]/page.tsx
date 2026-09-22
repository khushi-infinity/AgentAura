"use client";

import { PixelSprite, AgentSprite } from "@/components/PixelSprite";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Badge, ProgressBar, PixelButton, PixelLink, EmptyState, DemoTag } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";
import { LiveActivity } from "@/components/LiveActivity";
import { STATUS_LABEL, ROLE_META, type AgentRole } from "@/lib/types";

// Mission detail (spec §8): breakdown, assigned agents, outcome, notes,
// suggested agents based on capability gaps. Live timeline from SSE.

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

const TASK_STATE_STEPS = ["PLANNED", "ASSIGNED", "EXECUTING", "OUTSOURCING", "AWAITING_PROVIDER", "DELIVERED", "VERIFYING", "VERIFIED", "PAID", "COMPLETED"];

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
    return <div className="p-10 text-cream/60 text-sm">Loading mission…</div>;
  }

  const m = data.mission;
  const task = data.tasks.find((t) => t.id === selectedTask) ?? data.tasks[0];
  const meta = task ? ROLE_META[task.role as AgentRole] : null;

  return (
    <div>
      <Hero
        title="Mission"
        subtitle={m.objective}
        art={<PixelScenery variant="mountain" />}
      />
      <div className="p-6 grid xl:grid-cols-[1.7fr_1fr] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          {/* Overview */}
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge color="leaf">● {STATUS_LABEL[m.status] ?? m.status}</Badge>
                <Badge color={m.priority === "HIGH" ? "danger" : m.priority === "MEDIUM" ? "gold" : "muted"}>
                  {m.priority.toLowerCase()} priority
                </Badge>
              </div>
              <span className="text-xs text-ink-soft">{m.completedTasks}/{m.totalTasks} tasks</span>
            </div>
            <div className="mt-3">
              <ProgressBar pct={m.progress} />
            </div>
          </Card>

          {/* Task breakdown */}
          <div className="space-y-3">
            <div className="font-pixel text-[10px] text-cream">Task Breakdown</div>
            {data.tasks.length === 0 ? (
              <EmptyState icon="missions" title="No tasks yet" hint="Launch the mission from Home to let the CEO plan it." />
            ) : (
              data.tasks.map((t) => {
                const tm = ROLE_META[t.role as AgentRole];
                const active = t.id === task?.id;
                return (
                  <button key={t.id} onClick={() => setSelectedTask(t.id)} className="block w-full text-left">
                    <Card className={`p-3.5 transition-shadow ${active ? "ring-2 ring-leaf" : "hover:shadow-pixel"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl" aria-hidden><AgentSprite role={t.role} size={22} /></span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{t.objective}</div>
                          <div className="text-xs text-ink-soft mt-0.5">
                            {tm?.name ?? t.role}
                            {t.isOutsourced ? " · external hire" : ""}
                            {t.spendCents > 0 ? ` · ${(t.spendCents / 100).toFixed(2)} USD₮0` : ""}
                          </div>
                        </div>
                        <Badge color={t.status === "COMPLETED" ? "leaf" : t.status.includes("FAIL") || t.status === "REJECTED" ? "danger" : "gold"}>
                          {STATUS_LABEL[t.status] ?? t.status}
                        </Badge>
                      </div>
                    </Card>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected task execution timeline */}
          {task ? (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-pixel text-[10px]">Task Execution</span>
                {task.isOutsourced ? <DemoTag /> : null}
                <span className="ml-auto text-[10px] text-ink-soft">{task.id}</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl" aria-hidden><AgentSprite role={task.role} size={26} /></span>
                <div>
                  <div className="text-sm font-semibold">{meta?.name ?? task.role}</div>
                  <div className="text-xs text-ink-soft">{task.objective}</div>
                </div>
              </div>
              <ol className="relative ml-3 border-l-2 border-[#0f2b3355] space-y-3">
                {TASK_STATE_STEPS.map((s) => {
                  const reached = TASK_STATE_STEPS.indexOf(task.status) >= TASK_STATE_STEPS.indexOf(s);
                  return (
                    <li key={s} className="ml-5 flex items-center gap-2.5">
                      <span
                        className={`absolute -left-[7px] w-3 h-3 rounded-sm border-2 border-[#0f2b33] ${
                          reached ? "bg-leaf" : "bg-parchment2"
                        }`}
                      />
                      <span className={`text-xs ${reached ? "text-ink font-medium" : "text-ink-soft"}`}>
                        {STATUS_LABEL[s] ?? s}
                      </span>
                      {s === task.status ? <span className="w-1.5 h-1.5 bg-gold animate-blink ml-1" /> : null}
                    </li>
                  );
                })}
              </ol>
              {task.isOutsourced && task.externalProviderId ? (
                <div className="mt-4 text-xs text-ink-soft flex items-center gap-2">
                  <span aria-hidden className="text-leaf-deep"><PixelSprite name="EXTERNAL" size={16} /></span> External provider: <code className="bg-parchment px-1.5 py-0.5 rounded-sm border border-[#0f2b3333]">{task.externalProviderId.replace("prov_", "")}</code>
                </div>
              ) : null}
            </Card>
          ) : null}

          {/* Deliverables */}
          {data.deliverables.length > 0 ? (
            <div className="space-y-3">
              <div className="font-pixel text-[10px] text-cream">Deliverables</div>
              {data.deliverables.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color={d.verificationStatus === "VERIFIED" ? "leaf" : "gold"}>
                      {d.verificationStatus.toLowerCase()} · {d.verificationScore}/100
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{d.content}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right rail */}
        <div className="space-y-4 min-w-0">
          <LiveActivity companyId={m.companyId} />
          <Card className="p-4">
            <div className="font-pixel text-[10px] mb-2">Suggested external help</div>
            <p className="text-xs text-ink-soft mb-3">
              When agents detect a capability gap, matching specialists appear here.
            </p>
            <PixelLink href="/marketplace" variant="gold" className="!text-[9px] !py-2 w-full">
              Browse Marketplace
            </PixelLink>
          </Card>
        </div>
      </div>
    </div>
  );
}
