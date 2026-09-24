"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const AGENTS_PREVIEW = [
  { icon: "🤖", name: "CEO Agent", role: "Planning", desc: "Oversees strategy and decision making" },
  { icon: "📊", name: "Strategy Agent", role: "Strategy", desc: "Planning and market positioning" },
  { icon: "🔍", name: "Research Agent", role: "Research", desc: "Market, users and competitors" },
  { icon: "📢", name: "Marketing Agent", role: "Marketing", desc: "Content, growth and community" },
  { icon: "🛡️", name: "Verification Agent", role: "Quality", desc: "Quality check and validation" },
];

function CreateInner() {
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState(params.get("goal") ?? "");
  const [budget, setBudget] = useState(10);
  // Default to human-in-the-loop: the approve-hire moment (banner → OKX AI
  // marketplace → x402 settlement) is the product's core demo. Founders can
  // switch to auto-hire here or later in Settings.
  const [policy, setPolicy] = useState("ASK_BEFORE_HIRING");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assemble = async () => {
    // The goal is the whole point of the product — never invent one.
    if (!goal.trim() || busy) return;
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
      if (!res.ok || !data?.companyId) {
        // Never navigate on failure — show the real error instead of a bounce.
        setError("Couldn't assemble your company. Please try again.");
        setBusy(false);
        return;
      }
      // Kick off the mission immediately. A failure here is not fatal —
      // home re-dispatches, so land on the dashboard either way.
      await fetch(`/api/companies/${data.companyId}/goals/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: data.missionId }),
      }).catch(() => null);
      // Hard navigation: guarantees home re-mounts fresh (no client-side
      // cache race with the just-created company) and lands on the dashboard.
      window.location.assign(`/?company=${data.companyId}&fresh=1`);
    } finally {
      setBusy(false);
    }
  };

  const goalOk = goal.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8f5eb] relative overflow-hidden" data-purpose="content-area">
      {/* Top Pixel Landscape Header Banner */}
      <div className="relative w-full h-20 sm:h-24 overflow-hidden border-b border-[#e2dcc8]">
        <img
          alt="AgentAura Forest Landscape"
          className="w-full h-full object-cover object-center pixelated"
          src="/banners/forest.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f8f5eb]/90" />
      </div>

      {/* Workspace Container */}
      <div className="p-4 sm:p-6 md:p-8 flex-1 relative z-10">
        {/* Top Header & Quote Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#193238] tracking-tight">
              Create Your Company
            </h2>
            <p className="text-xs sm:text-sm text-[#5f7478] font-medium mt-0.5">
              Set up your autonomous AI workforce.
            </p>
          </div>
          {/* Quote Badge */}
          <div className="inline-flex items-center space-x-2 text-xs font-medium text-[#486b6e] bg-[#e7f1ee]/90 px-3.5 py-1.5 rounded-full border border-[#cbdcd8] shadow-sm self-start">
            <span className="text-emerald-600 font-bold">✦</span>
            <span>“A goal, a budget, a workforce. That's a company.”</span>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: Creation Form (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5" data-purpose="create-company-form">
            {/* Company Name + Budget side-by-side — compact so the CTA stays in view */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#233f42] mb-1.5" htmlFor="company-name">
                Company Name
              </label>
              <input
                className="w-full text-xs font-semibold text-[#183134] bg-white rounded-lg border border-[#d6cfb8] px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                id="company-name"
                type="text"
                placeholder="e.g. Aura Labs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              </div>
              <div>
              <label className="block text-xs font-bold text-[#233f42] mb-1.5" htmlFor="initial-budget">
                Initial Budget (USDT)
              </label>
              <input
                className="w-full text-xs font-semibold text-[#183134] bg-white rounded-lg border border-[#d6cfb8] px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                id="initial-budget"
                type="number"
                min={1}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
              </div>
            </div>

            {/* What are you building? */}
            <div>
              <label className="block text-xs font-bold text-[#233f42] mb-1.5" htmlFor="building-desc">
                What are you building?
              </label>
              <textarea
                className="w-full text-xs font-medium text-[#183134] bg-white rounded-lg border border-[#d6cfb8] px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                id="building-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Primary Goal */}
            <div>
              <label className="block text-xs font-bold text-[#233f42] mb-1.5" htmlFor="primary-goal">
                Primary Goal
              </label>
              <input
                className={`w-full text-xs font-medium text-[#183134] bg-white rounded-lg border px-3.5 py-2.5 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                  goal && !goalOk ? "border-red-400" : goalOk ? "border-emerald-400" : "border-[#d6cfb8]"
                }`}
                id="primary-goal"
                type="text"
                placeholder="e.g. Research my market and launch a go-to-market plan"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            {/* Agent Autonomy Radio Selection */}
            <div>
              <label className="block text-xs font-bold text-[#233f42] mb-1.5">Agent Autonomy</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "MANUAL_APPROVAL",
                    title: "Ask before hiring",
                    desc: "Require founder approval for external agents",
                  },
                  {
                    id: "AUTO_HIRE_BELOW_BUDGET",
                    title: "Autonomous within budget",
                    desc: "Agents hire within available funds automatically",
                  },
                  {
                    id: "FULL_AUTONOMY",
                    title: "Full Autonomy",
                    desc: "Agents manage tasks and hiring independently",
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPolicy(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      policy === opt.id
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500"
                        : "border-[#d6cfb8] bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 mb-1">{opt.title}</div>
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action — sticky bottom so it's always reachable */}
            <div className="pt-1 lg:sticky lg:bottom-2">
              <button
                type="button"
                onClick={assemble}
                disabled={busy || !goalOk}
                title={goalOk ? undefined : "Describe what your company should achieve first"}
                className="w-full py-3 rounded-xl bg-[#006050] hover:bg-[#004d40] text-white text-sm font-bold flex items-center justify-center gap-2 shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{busy ? "Assembling Team & Minting Wallet..." : goalOk ? "Assemble My Company →" : "Write your Primary Goal to continue"}</span>
              </button>
              {error && (
                <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center" role="alert">
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Team & Wallet Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Default Starter Team */}
            <div className="bg-white rounded-2xl border border-[#d6cfb8] p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-[#193336] uppercase tracking-wide mb-3">
                Your AI Company Will Include
              </h3>
              <div className="space-y-2.5">
                {AGENTS_PREVIEW.map((ag) => (
                  <div
                    key={ag.name}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#fcfbf7] border border-[#ece8db]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{ag.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{ag.name}</div>
                        <div className="text-[10px] text-slate-500">{ag.desc}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ag.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* OKX Agentic Wallet Card */}
            <div className="bg-gradient-to-br from-[#012627] to-[#033b3c] text-white rounded-2xl p-4 border border-[#0d4a4d] shadow-md space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">Agentic Wallet · OKX X Layer</span>
                <span className="text-[10px] font-mono text-emerald-400/80">0x3f9A...8b21</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-snug">
                An onchain wallet will be provisioned on OKX X Layer testnet to enable autonomous micro-settlements and escrow contracts.
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-emerald-800/40">
                <span className="text-slate-300">Initial Allocation:</span>
                <span className="font-bold text-amber-300">{budget} USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateCompanyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading form...</div>}>
      <CreateInner />
    </Suspense>
  );
}
