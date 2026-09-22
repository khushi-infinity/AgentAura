"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Badge, ProgressBar, Stat, PixelLink, DemoTag } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";
import { AgentGraph } from "@/components/AgentGraph";
import { LiveActivity } from "@/components/LiveActivity";

// Home / Command Center (spec §8): current mission + progress, living
// agent workspace (graph from real state), right rail Live Activity,
// bottom quick cards.

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
}

function HomeInner() {
  const params = useSearchParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Single-company demo: use seeded company unless a newer one exists.
        const res = await fetch("/api/companies");
        if (res.ok) {
          setCompany((await res.json()) as CompanyData);
          return;
        }
        // Fall back to seeding a browse-friendly state via onboarding.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-10 text-cream/60 text-sm">Loading your company…</div>;
  }

  if (!company) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <div className="text-5xl mb-4" aria-hidden>🌲</div>
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
        title={`Good evening, Khushi`}
        subtitle={`Your AI company is up and running.`}
        art={<PixelScenery variant="forest" />}
      />

      <div className="p-6 grid xl:grid-cols-[1.6fr_1fr] gap-5 items-start">
        {/* Left column */}
        <div className="space-y-5 min-w-0">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-pixel text-xs mb-1.5">{company.company.name}</div>
                <div className="text-sm text-ink-soft">{activeMission?.objective ?? company.company.mission}</div>
              </div>
              <div className="flex items-center gap-2">
                {activeMission ? <Badge color="leaf">● {activeMission.status.toLowerCase()}</Badge> : null}
              </div>
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
              </div>
            ) : null}
            {params.get("fresh") ? (
              <div className="mt-4 flex items-center gap-2">
                <Badge color="gold">Mission started — watch Live Activity →</Badge>
              </div>
            ) : null}
          </Card>

          <AgentGraph companyId={company.company.id} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PixelLink href="/memory" variant="ghost" className="!justify-start !px-3 !py-3">
              🧠 Memory
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">Company knowledge</span>
            </PixelLink>
            <PixelLink href="/marketplace" variant="ghost" className="!justify-start !px-3 !py-3">
              🛒 Marketplace
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">Hire specialists</span>
            </PixelLink>
            <PixelLink href="/wallet" variant="ghost" className="!justify-start !px-3 !py-3">
              💰 Wallet
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">4.33 USD₮0</span>
            </PixelLink>
            <PixelLink href="/analytics" variant="ghost" className="!justify-start !px-3 !py-3">
              📊 Analytics
              <span className="block font-body normal-case text-[10px] text-ink-soft mt-1">Company metrics</span>
            </PixelLink>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <Stat icon="🤖" value={String(5)} label="Active Agents" />
            <Stat icon="🌐" value={String(2)} label="External Agents" accent="text-gold-deep" />
          </div>
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
