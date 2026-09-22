"use client";

import { AgentSprite } from "@/components/PixelSprite";

import { useEffect, useState } from "react";
import { Card, Badge, PixelLink, EmptyState } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";
import { ROLE_META, STATUS_LABEL, type AgentRole } from "@/lib/types";

// Agents (spec §8): internal and external agents visibly distinguished.

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

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [tab, setTab] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents ?? []))
      .finally(() => setLoading(false));
  }, []);

  const shown = agents.filter((a) => a.type === tab);
  const activeCount = agents.filter((a) => a.status === "WORKING").length;

  return (
    <div>
      <Hero
        title="Agents"
        subtitle="Your team of agents"
        art={<PixelScenery variant="lake" />}
      />
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card className="p-3">
            <div className="font-pixel text-sm">{agents.filter((a) => a.type === "INTERNAL").length}</div>
            <div className="pixel-label text-ink-soft mt-1">Company Agents</div>
          </Card>
          <Card className="p-3">
            <div className="font-pixel text-sm text-gold-deep">{agents.filter((a) => a.type === "EXTERNAL").length}</div>
            <div className="pixel-label text-ink-soft mt-1">External Hires</div>
          </Card>
          <Card className="p-3">
            <div className="font-pixel text-sm">{activeCount}</div>
            <div className="pixel-label text-ink-soft mt-1">On Tasks</div>
          </Card>
          <Card className="p-3">
            <div className="font-pixel text-sm">{agents.length}</div>
            <div className="pixel-label text-ink-soft mt-1">Total Agents Used</div>
          </Card>
        </div>

        <div className="flex items-center gap-2 mb-5">
          {(["INTERNAL", "EXTERNAL"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pixel-btn !text-[9px] !py-2 !px-3 ${tab === t ? "pixel-btn-primary" : "pixel-btn-ghost"}`}
            >
              {t === "INTERNAL" ? "Company Agents" : "External Agents"}
            </button>
          ))}
          <PixelLink href="/marketplace" variant="gold" className="ml-auto !text-[9px] !py-2 !px-3">
            + Add Agent
          </PixelLink>
        </div>

        {loading ? (
          <div className="text-ink-soft text-sm">Loading agents…</div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={tab === "EXTERNAL" ? "EXTERNAL" : "agents"}
            title={tab === "EXTERNAL" ? "No external agents yet" : "No agents yet"}
            hint={tab === "EXTERNAL" ? "External specialists appear here after an agent hires them." : "Create a company to assemble your team."}
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shown.map((a) => {
              const meta = ROLE_META[a.role as AgentRole];
              return (
                <Card key={a.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl w-11 h-11 flex items-center justify-center bg-parchment border-2 border-[#0f2b33] rounded-sm" aria-hidden>
                      <AgentSprite role={a.role} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{a.name}</span>
                        {a.type === "EXTERNAL" ? <Badge color="gold">external</Badge> : null}
                      </div>
                      <div className="text-xs text-ink-soft mt-0.5">{a.description || meta?.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge color={a.status === "WORKING" ? "gold" : "leaf"}>● {STATUS_LABEL[a.status] ?? a.status}</Badge>
                    <span className="text-xs text-ink-soft">{a.taskCount} tasks</span>
                    <span className="text-xs text-ink-soft">· {a.successRate}% success</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <PixelLink href="/missions" variant="ghost" className="!text-[9px] !py-2 flex-1">
                      View work
                    </PixelLink>
                    {a.type === "EXTERNAL" ? (
                      <PixelLink href="/marketplace" variant="ghost" className="!text-[9px] !py-2 flex-1">
                        Provider
                      </PixelLink>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
