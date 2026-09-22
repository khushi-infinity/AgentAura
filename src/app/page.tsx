"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHead, Badge, ProgressBar, Stat, PixelLink } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";
import { AgentGraph } from "@/components/AgentGraph";
import { LiveActivity } from "@/components/LiveActivity";

// Home / Command Center (spec §8): current mission + progress, living agent
// workspace (graph from real state), Live Activity, quick cards.
//
// Layout matches the reference: three equal columns of chunky cream cards
// with dark header bars, on the dark teal-blue canvas.

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
  company: { id: string; name: string; mission: string | null; autonomyPolicy: string };
  missions: Mission[];
  agentCount?: number;
  externalCount?: number;
}

function HomeInner() {
  const params = useSearchParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const data = (await res.json()) as CompanyData;
          setCompany(data);
          const w = await fetch(`/api/wallet?companyId=${data.company.id}`);
          if (w.ok) {
            const wj = (await w.json()) as { wallet?: { availableCents?: number } };
            setBalanceCents(wj.wallet?.availableCents ?? null);
          }
          return;
        }
        // Fall back to seeding a browse-friendly state via onboarding.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Re-read the wallet while a mission runs so the card stays honest.
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
    return <div className="p-10 text-cream/60 text-sm">Loading your company…</div>;
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

  const activeMission = company.missions.find((m) => m.status === "ACTIVE") ?? company.missions[0];

  return (
    <div>
      <Hero
        title="Good evening, Khushi"
        subtitle="Your AI company is up and running."
        art={<PixelScenery variant="forest" />}
      />

      {/* 3 equal columns from lg (1024px): the reference shows three cream
          cards side by side at ~1111px viewport width. */}
      {/* Content fills most of the frame so the functional UI dominates and
          the dark canvas only frames it (spec §6). */}
      <div className="p-3 grid gap-3 lg:grid-cols-3 items-start">
        {/* ── Column 1: mission + treasury ── */}
        <div className="space-y-5 min-w-0">
          <Card className="overflow-hidden">
            <CardHead>
              <span>Current mission</span>
              {activeMission ? (
                <span className="ml-auto normal-case">
                  <Badge color="leaf">● {activeMission.status.toLowerCase()}</Badge>
                </span>
              ) : null}
            </CardHead>
            <div className="p-4">
              <div className="font-pixel text-xs mb-2">{company.company.name}</div>
              <div className="text-sm text-ink-soft">
                {activeMission?.objective ?? company.company.mission}
              </div>
              {activeMission ? (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-ink-soft mb-1.5">
                    <span>
                      {activeMission.completedTasks}/{activeMission.totalTasks} tasks
                    </span>
                    <span>{activeMission.progress}%</span>
                  </div>
                  <ProgressBar pct={activeMission.progress} />
                  <div className="flex justify-between text-[10px] text-ink-soft mt-2">
                    <span>Spend</span>
                    <span>{(activeMission.spendCents / 100).toFixed(2)} USD₮0</span>
                  </div>
                </div>
              ) : null}
              {params.get("fresh") ? (
                <div className="mt-4">
                  <Badge color="gold">Mission started — watch Live Activity →</Badge>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            <Stat icon="agents" value={String(company.agentCount ?? 0)} label="Active agents" />
            <Stat
              icon="marketplace"
              value={String(company.externalCount ?? 0)}
              label="External agents hired"
              accent="text-gold-deep"
            />
            <Stat
              icon="wallet"
              value={balanceCents === null ? "—" : `${(balanceCents / 100).toFixed(2)} USD₮0`}
              label="Treasury available"
            />
          </div>
        </div>

        {/* ── Column 2: living agent workspace ── */}
        <div className="space-y-5 min-w-0">
          <AgentGraph companyId={company.company.id} />

          <div className="grid grid-cols-2 gap-3">
            <PixelLink href="/marketplace" variant="ghost" className="!justify-start !px-3 !py-3">
              Marketplace
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">
                Hire specialists
              </span>
            </PixelLink>
            <PixelLink href="/memory" variant="ghost" className="!justify-start !px-3 !py-3">
              Memory
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">
                Company knowledge
              </span>
            </PixelLink>
            <PixelLink href="/wallet" variant="ghost" className="!justify-start !px-3 !py-3">
              Wallet
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">
                Agent economy
              </span>
            </PixelLink>
            <PixelLink href="/analytics" variant="ghost" className="!justify-start !px-3 !py-3">
              Analytics
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">
                Company metrics
              </span>
            </PixelLink>
          </div>
        </div>

        {/* ── Column 3: live activity ── */}
        <div className="space-y-5 min-w-0">
          <LiveActivity companyId={company.company.id} />
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
