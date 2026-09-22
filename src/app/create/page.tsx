"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PixelButton } from "@/components/ui";
import { PixelScenery } from "@/components/AppShell";

// Create Company (spec §8): name, description, goal, budget, autonomy
// policy + preview of agents that will be assembled.

const AGENTS_PREVIEW = [
  { icon: "👑", name: "CEO Agent", desc: "Oversees strategy and decision making" },
  { icon: "🧭", name: "Strategy Agent", desc: "Planning and market positioning" },
  { icon: "🔬", name: "Research Agent", desc: "Market, users and competitors" },
  { icon: "📣", name: "Marketing Agent", desc: "Content, growth and community" },
  { icon: "🛡️", name: "Verification Agent", desc: "Quality check and validation" },
];

function CreateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("Acme AI");
  const [description, setDescription] = useState("AI-powered developer productivity tool");
  const [goal, setGoal] = useState(params.get("goal") ?? "Launch our product and get first 100 users");
  const [budget, setBudget] = useState(10);
  const [policy, setPolicy] = useState("AUTO_HIRE_BELOW_BUDGET");
  const [busy, setBusy] = useState(false);

  const assemble = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          primaryGoal: goal,
          budgetUsd: budget,
          autonomyPolicy: policy,
        }),
      });
      const data = (await res.json()) as { companyId: string; missionId: string };
      // Kick off the mission immediately.
      await fetch(`/api/companies/${data.companyId}/goals/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: data.missionId }),
      });
      router.push(`/?company=${data.companyId}&fresh=1`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl" aria-hidden>🌲</span>
          <div className="font-pixel text-cream text-lg">Create Your Company</div>
        </div>
        <p className="text-cream/70 text-sm mb-6">Set up your autonomous AI workforce.</p>

        <div className="grid md:grid-cols-[1.2fr_1fr] gap-6">
          {/* Form */}
          <div className="pixel-card p-5 space-y-4">
            <div>
              <label className="pixel-label block mb-1.5" htmlFor="cname">Company Name</label>
              <input
                id="cname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-2 border-[#143329] bg-parchment rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-leaf"
              />
            </div>
            <div>
              <label className="pixel-label block mb-1.5" htmlFor="cdesc">What are you building?</label>
              <input
                id="cdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-2 border-[#143329] bg-parchment rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-leaf"
              />
            </div>
            <div>
              <label className="pixel-label block mb-1.5" htmlFor="cgoal">Primary Goal</label>
              <input
                id="cgoal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full border-2 border-[#143329] bg-parchment rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-leaf"
              />
            </div>
            <div>
              <label className="pixel-label block mb-1.5" htmlFor="cbudget">Initial Budget (USD₮0)</label>
              <input
                id="cbudget"
                type="number"
                min={1}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full border-2 border-[#143329] bg-parchment rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-leaf"
              />
            </div>
            <div>
              <span className="pixel-label block mb-1.5">Agent Autonomy</span>
              <div className="space-y-2">
                {[
                  { id: "ASK_BEFORE_HIRING", label: "Ask before hiring", hint: "You approve every external hire" },
                  { id: "AUTO_HIRE_BELOW_BUDGET", label: "Auto-hire under budget", hint: "Agents act freely within your budget" },
                  { id: "FULLY_AUTONOMOUS", label: "Fully autonomous", hint: "No approval needed" },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 border-2 rounded-sm px-3 py-2.5 cursor-pointer transition-colors ${
                      policy === opt.id ? "border-leaf bg-[#e7f2ea]" : "border-[#14332955] bg-parchment hover:border-leaf/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="policy"
                      checked={policy === opt.id}
                      onChange={() => setPolicy(opt.id)}
                      className="accent-[#2e7d4f]"
                    />
                    <span>
                      <span className="text-sm font-medium block">{opt.label}</span>
                      <span className="text-xs text-ink-soft">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <PixelButton className="w-full" onClick={assemble} disabled={busy}>
              {busy ? "Assembling…" : "Assemble My Company →"}
            </PixelButton>
          </div>

          {/* Preview */}
          <div className="pixel-card p-5">
            <div className="font-pixel text-[10px] mb-4">Your AI Company Will Include</div>
            <div className="space-y-3">
              {AGENTS_PREVIEW.map((a) => (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-xl w-9 h-9 flex items-center justify-center bg-parchment border-2 border-[#143329] rounded-sm" aria-hidden>
                    {a.icon}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{a.name}</div>
                    <div className="text-xs text-ink-soft">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pixel-rule my-4" />
            <p className="text-xs text-ink-soft">
              More agents can be hired as needed from the OKX.AI marketplace when your team hits a capability gap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forest" />}>
      <CreateInner />
    </Suspense>
  );
}
