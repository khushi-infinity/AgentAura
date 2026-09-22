"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardHead,
  Badge,
  ProgressBar,
  MeterRow,
  Row,
  PixelLink,
} from "@/components/ui";
import { PixelScenery } from "@/components/AppShell";
import { AgentGraph } from "@/components/AgentGraph";
import { LiveActivity } from "@/components/LiveActivity";
import { PixelSprite } from "@/components/PixelSprite";

// Home / Command Center (spec §8).
//
// Layout is matched to the reference screenshot, which was measured
// pixel-by-pixel (see PROJECT_PROGRESS.md):
//   - the reference has NO tall full-width hero band — its dark top bar is a
//     single thin row and the three cream columns run from the very top to the
//     very bottom of the viewport
//   - its cards are DENSE and full of FILLED BLUE elements (meters, pills,
//     buttons), not near-empty cream
//   - ~4 stacked blocks per column
// So: a slim headline strip, then three columns that each fill the remaining
// viewport height, with the last card in each column scrolling internally.

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

function HomeInner() {
  const params = useSearchParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/companies");
        if (!res.ok) return;
        const data = (await res.json()) as CompanyData;
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Keep the treasury figure honest while a mission is running.
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

  if (loading) {
    return (
      <div className="h-[calc(100vh-72px)] grid place-items-center">
        <span className="pixel-label text-cream/60 animate-pulse-soft">Loading your company…</span>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <div className="font-pixel text-cream text-sm mb-3">No company yet</div>
        <p className="text-cream/60 text-sm mb-6">
          Create your AI company and give it a mission. Agents take it from there.
        </p>
        <div className="flex gap-3 justify-center">
          <PixelLink href="/onboarding" variant="gold">Start onboarding</PixelLink>
          <PixelLink href="/create">Create company</PixelLink>
        </div>
      </div>
    );
  }

  const missions = company.missions ?? [];
  const activeMission = missions.find((m) => m.status === "ACTIVE") ?? missions[0];
  const completed = missions.filter((m) => m.status === "COMPLETED").length;
  const internals = agents.filter((a) => a.type === "INTERNAL");
  const externals = agents.filter((a) => a.type === "EXTERNAL");
  const budget = (company.company.budgetCents ?? 0) / 100;
  const balance = balanceCents === null ? null : balanceCents / 100;
  const spentPct = budget > 0 && balance !== null ? Math.max(0, Math.round(((budget - balance) / budget) * 100)) : 0;

  return (
    // Chrome is 70px tall (top bar 38 + status strip 32) and the padding is
    // 24px, so the dashboard fills exactly one viewport with no page scroll.
    <div className="p-2 flex flex-col gap-2 lg:h-[calc(100vh-86px)] lg:min-h-[560px] lg:overflow-hidden">
      {/* ── Slim headline strip (the reference has no tall hero band) ── */}
      <div className="pixel-headline bg-forest-2 border-2 border-[#01141c] rounded-md shrink-0">
        <span className="font-pixel text-cream text-[13px] leading-none">{company.company.name}</span>
        <span className="hidden md:inline text-cream/55 text-xs truncate max-w-[420px]">
          {company.company.mission}
        </span>
        <span className="ml-auto flex items-center gap-2 flex-wrap">
          <Badge color="steel">
            {company.company.autonomyPolicy.replaceAll("_", " ").toLowerCase()}
          </Badge>
          <Badge color={activeMission?.status === "COMPLETED" ? "leaf" : "gold"}>
            {activeMission?.status?.toLowerCase() ?? "no mission"}
          </Badge>
          <Badge color="sky">◈ simulated</Badge>
        </span>
      </div>

      {/* ── Three full-height columns ──
          The reference leaves WIDE dark gutters between columns (measured at
          ~60 CSS px at 1111px viewport width, vs the ~12px a normal grid
          uses), which is a large part of its distinctive look. */}
      <div className="grid gap-2 lg:gap-14 lg:grid-cols-3 flex-1 min-h-0">
        {/* ══ Column 1: mission, treasury, metrics ══ */}
        <div className="flex flex-col gap-3 min-h-0">
          <Card className="shrink-0">
            <CardHead>
              <PixelSprite name="missions" size={13} />
              <span>Mission control</span>
              {activeMission ? (
                <span className="ml-auto normal-case">{activeMission.completedTasks}/{activeMission.totalTasks} tasks</span>
              ) : null}
            </CardHead>
            <div className="p-3">
              <div className="text-sm text-ink leading-snug">
                {activeMission?.objective ?? company.company.mission}
              </div>
              {activeMission ? (
                <div className="mt-3">
                  <div className="flex justify-between pixel-label text-ink-soft mb-1.5">
                    <span>Progress</span>
                    <span className="text-ink">{activeMission.progress}%</span>
                  </div>
                  <ProgressBar pct={activeMission.progress} color="steel" />
                </div>
              ) : null}
              {params.get("fresh") ? (
                <div className="mt-3">
                  <Badge color="gold">Mission started — watch Live Activity →</Badge>
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="shrink-0">
            <CardHead>
              <PixelSprite name="wallet" size={13} />
              <span>Treasury</span>
              <span className="ml-auto normal-case">
                {balance === null ? "—" : `${balance.toFixed(2)} USD₮0`}
              </span>
            </CardHead>
            <div className="px-3 pt-2 pb-1">
              <MeterRow label="Budget spent" value={`${spentPct}%`} pct={spentPct} />
              <MeterRow
                label="Mission spend"
                value={`$${((activeMission?.spendCents ?? 0) / 100).toFixed(2)}`}
                pct={activeMission && budget > 0 ? ((activeMission.spendCents / 100) / budget) * 100 : 0}
              />
              <MeterRow
                label="Allocated to external hires"
                value={String(company.externalCount ?? 0)}
                pct={(company.externalCount ?? 0) * 25}
                color="sky"
              />
            </div>
            {/* Environmental pixel art as an in-card strip (spec §6) rather than
                a full-width band, which the reference does not have. */}
            <div className="relative h-14 overflow-hidden border-t-2 border-[#0f2b33]">
              <div className="absolute inset-0">
                <PixelScenery variant="lake" />
              </div>
            </div>
          </Card>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHead>
              <PixelSprite name="analytics" size={13} />
              <span>Company metrics</span>
            </CardHead>
            <div className="px-3 py-2 overflow-y-auto pixel-scroll">
              <MeterRow label="Active agents" value={String(internals.length)} pct={internals.length * 20} />
              <MeterRow label="External ASPs hired" value={String(company.externalCount ?? 0)} pct={(company.externalCount ?? 0) * 25} />
              <MeterRow label="Missions completed" value={String(completed)} pct={missions.length ? (completed / missions.length) * 100 : 0} />
              <MeterRow label="Roster readiness" value={`${internals.filter((a) => a.status !== "OFFLINE").length}/${internals.length}`} pct={internals.length ? (internals.filter((a) => a.status !== "OFFLINE").length / internals.length) * 100 : 0} />
            </div>
          </Card>
        </div>

        {/* ══ Column 2: living agent workspace + roster ══ */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="shrink-0">
            <AgentGraph companyId={company.company.id} />
          </div>

          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHead>
              <PixelSprite name="agents" size={13} />
              <span>Roster</span>
              <span className="ml-auto normal-case">{agents.length} agents</span>
            </CardHead>
            <div className="px-3 overflow-y-auto pixel-scroll flex-1 min-h-0">
              {agents.length === 0 ? (
                <div className="py-6 text-center pixel-label text-ink-soft">No agents yet</div>
              ) : (
                agents.map((a) => (
                  <Row key={a.id}>
                    <span className="w-6 h-6 shrink-0 grid place-items-center bg-parchment border border-[#0f2b33]">
                      <PixelSprite name={a.role} size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block pixel-label text-ink truncate">{a.name}</span>
                      <span className="block text-[10px] text-ink-soft">
                        {a.type === "EXTERNAL" ? "external ASP" : a.role.toLowerCase()} · {a.taskCount} tasks
                      </span>
                    </span>
                    <span className="w-16 shrink-0">
                      <span className="pixel-meter">
                        <span className="bg-steel" style={{ width: `${a.successRate}%` }} />
                      </span>
                      <span className="block pixel-label text-ink-soft text-right mt-1">{a.successRate}%</span>
                    </span>
                    <Badge color={a.status === "WORKING" ? "gold" : a.type === "EXTERNAL" ? "sky" : "leaf"}>
                      {a.status.toLowerCase()}
                    </Badge>
                  </Row>
                ))
              )}
            </div>
          </Card>

          <Card className="shrink-0">
            <CardHead>
              <PixelSprite name="missions" size={13} />
              <span>Recent missions</span>
              <span className="ml-auto normal-case">{missions.length} total</span>
            </CardHead>
            <div className="px-3 py-1 max-h-[128px] overflow-y-auto pixel-scroll">
              {missions.length === 0 ? (
                <div className="py-4 text-center pixel-label text-ink-soft">No missions yet</div>
              ) : (
                missions.slice(0, 4).map((m) => (
                  <Row key={m.id}>
                    <span className="min-w-0 flex-1 text-[11px] text-ink truncate">{m.objective}</span>
                    <span className="w-14 shrink-0">
                      <span className="pixel-meter">
                        <span className="bg-steel" style={{ width: `${m.progress}%` }} />
                      </span>
                    </span>
                    <Badge color={m.status === "COMPLETED" ? "leaf" : "gold"}>
                      {m.status.toLowerCase()}
                    </Badge>
                  </Row>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* ══ Column 3: live activity + quick actions ══ */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            <LiveActivity companyId={company.company.id} fill />
          </div>

          <Card className="shrink-0">
            <CardHead>
              <PixelSprite name="marketplace" size={13} />
              <span>Quick actions</span>
            </CardHead>
            <div className="p-3 grid grid-cols-2 gap-2">
              <PixelLink href="/marketplace" className="!justify-start !px-2 !py-2 !text-[10px]">
                Marketplace
              </PixelLink>
              <PixelLink href="/memory" className="!justify-start !px-2 !py-2 !text-[10px]">
                Memory
              </PixelLink>
              <PixelLink href="/wallet" className="!justify-start !px-2 !py-2 !text-[10px]">
                Wallet
              </PixelLink>
              <PixelLink href="/analytics" className="!justify-start !px-2 !py-2 !text-[10px]">
                Analytics
              </PixelLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forest" />}>
      <HomeInner />
    </Suspense>
  );
}
