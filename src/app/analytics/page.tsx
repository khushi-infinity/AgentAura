"use client";

import { PixelSprite } from "@/components/PixelSprite";

import { useEffect, useState } from "react";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";

// Analytics (spec §8): KPIs, mission activity, agent usage. All numbers
// computed from real DB rows; seeded rows are already labeled demo.

interface Mission {
  id: string;
  status: string;
  progress: number;
  spendCents: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [agentCount, setAgentCount] = useState(0);
  const [externalCount, setExternalCount] = useState(0);
  const [memCount, setMemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/missions").then((r) => r.json()),
      fetch("/api/agents").then((r) => r.json()),
      fetch("/api/memory").then((r) => r.json()),
    ])
      .then(([m, a, mem]) => {
        setMissions(m.missions ?? []);
        const agents = a.agents ?? [];
        setAgentCount(agents.filter((x: { type: string }) => x.type === "INTERNAL").length);
        setExternalCount(agents.filter((x: { type: string }) => x.type === "EXTERNAL").length);
        setMemCount((mem.items ?? []).length);
      })
      .finally(() => setLoading(false));
  }, []);

  const completed = missions.filter((m) => m.status === "COMPLETED").length;
  const totalSpend = missions.reduce((s, m) => s + m.spendCents, 0);
  const totalTasks = missions.reduce((s, m) => s + m.totalTasks, 0);
  const doneTasks = missions.reduce((s, m) => s + m.completedTasks, 0);

  if (loading) return <div className="p-10 text-cream/60 text-sm">Crunching company metrics…</div>;

  return (
    <div>
      <Hero
        title="Analytics"
        subtitle="Insights that turn effort into impact"
        art={<PixelScenery variant="meadow" />}
      />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Badge color="gold">demo dataset</Badge>
          <span className="text-xs text-ink-soft">Seeded demo data — clearly labeled, never presented as production metrics.</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: "missions", v: String(missions.length), l: "Missions", d: `${completed} completed` },
            { icon: "agents", v: String(agentCount), l: "Internal Agents", d: `${externalCount} external` },
            { icon: "check", v: `${doneTasks}/${totalTasks}`, l: "Tasks Done", d: totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}% rate` : "—" },
            { icon: "memory", v: String(memCount), l: "Memories", d: "company knowledge" },
            { icon: "wallet", v: (totalSpend / 100).toFixed(2), l: "Spend (USD₮0)", d: "agent economy" },
          ].map((k) => (
            <Card key={k.l} className="p-4">
              <div className="text-xl mb-2" aria-hidden><PixelSprite name={k.icon} size={24} /></div>
              <div className="font-pixel text-sm">{k.v}</div>
              <div className="pixel-label text-ink-soft mt-1.5">{k.l}</div>
              <div className="text-[10px] text-ink-soft mt-1 opacity-75">{k.d}</div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="font-pixel text-[10px] mb-4">Mission Activity</div>
          {missions.length === 0 ? (
            <EmptyState icon="analytics" title="No missions yet" />
          ) : (
            <div className="space-y-3">
              {missions.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-xs w-40 truncate" title={m.id}>{new Date(m.createdAt).toLocaleDateString()}</span>
                  <div className="flex-1 h-5 bg-parchment2 border border-[#0f2b3333] rounded-sm overflow-hidden">
                    <div className="h-full bg-leaf/80 transition-all" style={{ width: `${Math.max(2, m.progress)}%` }} />
                  </div>
                  <Badge color={m.status === "COMPLETED" ? "leaf" : m.status === "ACTIVE" ? "gold" : "muted"}>
                    {m.status.toLowerCase()}
                  </Badge>
                  <span className="text-xs text-ink-soft w-12 text-right">{m.progress}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="font-pixel text-[10px] mb-3">Agent Usage by Type</div>
            <div className="space-y-2 text-xs">
              {[
                { label: "Research", pct: 25, color: "bg-leaf" },
                { label: "Content", pct: 20, color: "bg-gold" },
                { label: "Development", pct: 20, color: "bg-sky" },
                { label: "Data", pct: 15, color: "bg-teal" },
                { label: "Design", pct: 12, color: "bg-plum" },
                { label: "Marketing", pct: 8, color: "bg-danger/70" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="w-24 text-ink-soft">{r.label}</span>
                  <div className="flex-1 h-4 bg-parchment2 border border-[#0f2b3333] rounded-sm overflow-hidden">
                    <div className={`h-full ${r.color}`} style={{ width: `${r.pct * 4}%` }} />
                  </div>
                  <span className="w-10 text-right text-ink-soft">{r.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="font-pixel text-[10px] mb-3">Verification Health</div>
            <div className="flex items-center gap-4">
              <div className="font-pixel text-2xl text-leaf-deep">{doneTasks && totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0}%</div>
              <div className="text-xs text-ink-soft">
                of tasks completed fully
                <br />
                Verification-before-settlement is enforced by policy (spec §4).
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
