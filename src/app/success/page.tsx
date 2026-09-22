"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Badge, PixelLink, PixelButton, DemoTag } from "@/components/ui";
import { PixelScenery } from "@/components/AppShell";

// Success (spec §8): MISSION COMPLETE — goal, tasks, agents, external
// hires, executions, spend, verification rate. Small celebration.

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
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const [data, setData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id;
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/missions/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params?.id]);

  const outsourced = data?.tasks.filter((t) => t.isOutsourced).length ?? 0;
  const verified = data?.tasks.filter((t) => t.status === "COMPLETED" || t.status === "PAID").length ?? 0;

  return (
    <div className="min-h-screen bg-forest flex flex-col">
      <div className="relative flex-1 flex items-center justify-center px-4 py-10 overflow-hidden">
        <div className="absolute inset-0 opacity-70" aria-hidden>
          <PixelScenery variant="mountain" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-forest/30 to-forest" aria-hidden />

        <div className="relative z-10 w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 bg-cream border-2 border-[#143329] rounded-md px-6 py-4 shadow-pixel hero-float">
              <span className="text-3xl animate-float-y" aria-hidden>🏆</span>
              <div className="text-left">
                <div className="font-pixel text-sm">MISSION COMPLETE!</div>
                <div className="text-xs text-ink-soft mt-1">{data?.mission.objective ?? "Your mission wrapped up."}</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-cream/60 text-sm">Gathering mission results…</div>
          ) : (
            <Card className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: "✅", v: `${data?.mission.completedTasks ?? 0}/${data?.mission.totalTasks ?? 0}`, l: "Tasks Completed" },
                  { icon: "🤖", v: "5", l: "Agents Involved" },
                  { icon: "🌐", v: String(outsourced), l: "External Hires" },
                  { icon: "💰", v: ((data?.mission.spendCents ?? 0) / 100).toFixed(2), l: "Spend (USD₮0)" },
                ].map((s) => (
                  <div key={s.l} className="text-center bg-parchment border-2 border-[#14332933] rounded-sm py-3">
                    <div className="text-xl mb-1" aria-hidden>{s.icon}</div>
                    <div className="font-pixel text-xs">{s.v}</div>
                    <div className="pixel-label text-ink-soft mt-1.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="pixel-rule my-4" />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge color="leaf">verification rate {data?.mission.totalTasks ? Math.round((verified / data.mission.totalTasks) * 100) : 100}%</Badge>
                  <DemoTag />
                </div>
                <span className="text-[10px] text-ink-soft">verified work before settlement (spec §4)</span>
              </div>

              <div className="flex gap-3 mt-5">
                <PixelLink href="/missions" variant="ghost" className="flex-1 !text-[9px]">View Report</PixelLink>
                <PixelButton variant="gold" className="flex-1" onClick={() => router.push("/create")}>
                  Start New Mission
                </PixelButton>
              </div>
            </Card>
          )}

          <p className="text-center text-cream/60 text-xs mt-6">From idea to impact. Together. 🌲</p>
        </div>
      </div>
    </div>
  );
}
