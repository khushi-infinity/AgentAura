"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PixelButton, PixelLink } from "@/components/ui";
import { PixelScenery } from "@/components/AppShell";

// Onboarding (spec §8): What are you building? → Let's Build.

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");

  const go = () => {
    const q = goal.trim() ? `?goal=${encodeURIComponent(goal.trim())}` : "";
    router.push(`/create${q}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-forest">
      {/* Environmental hero */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" aria-hidden>
          <PixelScenery variant="forest" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-forest/40 via-forest/20 to-forest" aria-hidden />

        <div className="relative z-10 w-full max-w-xl px-6">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <span className="text-4xl animate-float-y" aria-hidden>🤖</span>
            <div className="font-pixel text-cream text-xl leading-relaxed drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
              Welcome to AgentAura
            </div>
          </div>

          <div className="pixel-card p-6">
            <p className="text-ink-soft text-sm mb-4">
              Turn your ideas into outcomes with an AI workforce.
            </p>
            <label className="pixel-label block mb-2" htmlFor="goal">
              What are you building?
            </label>
            <textarea
              id="goal"
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Launch my product and get first 100 users"
              className="w-full border-2 border-[#143329] bg-parchment rounded-sm p-3 text-sm focus:outline-none focus:border-leaf"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="pixel-label text-ink-soft hidden sm:block">✨ Ideas are cheap. Execution compounds.</span>
              <PixelButton onClick={go}>Let&apos;s Build →</PixelButton>
            </div>
          </div>
        </div>
      </div>

      {/* Value props strip */}
      <div className="bg-forest-2 border-t-2 border-[#0a1613]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-6">
          {[
            { icon: "🤝", title: "AI Agents", desc: "A coordinated team from day one" },
            { icon: "🌐", title: "Real Expertise", desc: "Hire specialists from OKX.AI" },
            { icon: "⚡", title: "Autonomous Execution", desc: "Agents work while you sleep" },
            { icon: "💎", title: "Real Economic Value", desc: "Verified work, settled onchain" },
          ].map((v) => (
            <div key={v.title} className="text-center px-2">
              <div className="text-2xl mb-2" aria-hidden>{v.icon}</div>
              <div className="font-pixel text-[9px] text-leaf-bright">{v.title}</div>
              <div className="text-cream/60 text-xs mt-1.5">{v.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center pb-6">
          <PixelLink href="/create" variant="ghost" className="!text-[9px]">
            Skip ahead — create company
          </PixelLink>
        </div>
      </div>
    </div>
  );
}
