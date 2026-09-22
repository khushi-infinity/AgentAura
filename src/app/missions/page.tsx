"use client";

import { useEffect, useState } from "react";
import { Card, Badge, ProgressBar, PixelLink, EmptyState } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";
import { STATUS_LABEL } from "@/lib/types";

// Missions (spec §8): tabs + mission cards with goal, progress, priority.

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

const PRIORITY_COLOR: Record<string, "danger" | "gold" | "muted"> = {
  HIGH: "danger",
  MEDIUM: "gold",
  LOW: "muted",
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tab, setTab] = useState<"ACTIVE" | "COMPLETED" | "DRAFT">("ACTIVE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/missions")
      .then((r) => r.json())
      .then((d) => setMissions(d.missions ?? []))
      .finally(() => setLoading(false));
  }, []);

  const shown = missions.filter((m) => m.status === tab);

  return (
    <div>
      <Hero
        title="Missions"
        subtitle="Break big goals into achievable outcomes"
        art={<PixelScenery variant="mountain" />}
      />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(["ACTIVE", "COMPLETED", "DRAFT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pixel-btn !text-[9px] !py-2 !px-3 ${
                tab === t ? "pixel-btn-primary" : "pixel-btn-ghost"
              }`}
            >
              {STATUS_LABEL[t]} ({missions.filter((m) => m.status === t).length})
            </button>
          ))}
          <PixelLink href="/create" variant="gold" className="ml-auto !text-[9px] !py-2 !px-3">
            + New Mission
          </PixelLink>
        </div>

        {loading ? (
          <div className="text-ink-soft text-sm">Loading missions…</div>
        ) : shown.length === 0 ? (
          <EmptyState icon="missions" title={`No ${tab.toLowerCase()} missions`} hint="Create a company goal to get started." />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {shown.map((m) => (
              <PixelLink key={m.id} href={`/missions/${m.id}`} variant="ghost" className="!block !p-0 !border-0 !shadow-none hover:!translate-y-0">
                <Card className="p-4 hover:shadow-pixel-gold transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm leading-snug">{m.objective}</div>
                    <Badge color="leaf">● {STATUS_LABEL[m.status] ?? m.status}</Badge>
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-ink-soft mb-1.5">
                    <span>{m.completedTasks}/{m.totalTasks} tasks</span>
                    <span>{m.progress}%</span>
                  </div>
                  <ProgressBar pct={m.progress} color={m.status === "COMPLETED" ? "gold" : "leaf"} />
                  <div className="mt-3 flex items-center justify-between">
                    <Badge color={PRIORITY_COLOR[m.priority] ?? "muted"}>Priority {m.priority.toLowerCase()}</Badge>
                    {(m.spendCents ?? 0) > 0 ? (
                      <span className="text-xs text-gold-deep font-medium">
                        {(m.spendCents / 100).toFixed(2)} USD₮0 spent
                      </span>
                    ) : null}
                  </div>
                </Card>
              </PixelLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
