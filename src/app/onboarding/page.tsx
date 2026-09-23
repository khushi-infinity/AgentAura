"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Agents",
    desc: "Plan, delegate, hire and get work done.",
  },
  {
    icon: "🎯",
    title: "Real Expertise",
    desc: "Specialized agents for strategy, research & marketing.",
  },
  {
    icon: "🪙",
    title: "Seamless Payments",
    desc: "Micro-settlements in USDT on OKX X Layer.",
  },
  {
    icon: "🧠",
    title: "Memory & Knowledge",
    desc: "Every run compounds into shared intelligence.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [checking, setChecking] = useState(true);

  // Fresh-start flow: if a company already exists, this page's job is done —
  // go straight to the dashboard. A brand-new workspace stays here.
  useEffect(() => {
    let alive = true;
    fetch("/api/companies")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d?.company?.id) router.replace("/");
        else setChecking(false);
      })
      .catch(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [router]);

  const go = () => {
    if (!goal.trim()) return;
    router.push(`/create?goal=${encodeURIComponent(goal.trim())}`);
  };

  return (
    <main
      className="flex-1 relative flex flex-col justify-between overflow-hidden bg-cover bg-no-repeat min-h-screen"
      data-purpose="content-area"
      style={{
        backgroundImage: `url('/banners/onboarding.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center bottom",
      }}
    >
      {/* Subtle Ambient Dark Overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Top Floating Section: Sparkle Quote */}
      <div className="relative z-10 w-full flex justify-end p-6 pt-5">
        <div
          className="bg-[#fefaf0]/95 backdrop-blur-md rounded-xl px-5 py-2.5 flex items-center gap-3 max-w-sm border border-[#cebfa2] shadow-md"
          data-purpose="quote-badge"
        >
          <span className="text-[#1b435b] text-base font-bold">✦</span>
          <p className="text-[13px] font-bold text-[#1f2e3d] leading-snug tracking-tight">
            “Ideas are cheap.<br />Execution compounds.”
          </p>
        </div>
      </div>

      {/* Center Section: Hero Title & Creation Card */}
      <div className="relative z-10 flex flex-col justify-center px-4 items-center -mt-6">
        {/* Main Page Headlines */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
            <span className="text-[#162a36]">Welcome to </span>
            <span className="text-[#1f805a]">AgentAura</span>
          </h1>
          <p className="mt-2 text-base md:text-lg font-semibold text-[#2d3748] drop-shadow-sm">
            Turn your ideas into outcomes with an AI workforce.
          </p>
        </div>

        {/* Main Build Input Card */}
        <div
          className="bg-[#fefaf0]/95 backdrop-blur-md rounded-2xl w-full max-w-[530px] p-6 shadow-2xl mx-auto border-2 border-[#cebfa2]"
          data-purpose="prompt-card"
        >
          {checking ? (
            <div className="py-6 text-center text-sm font-bold text-[#5c6b74]">Loading…</div>
          ) : (
            <>
              <label
                className="block text-base md:text-lg font-extrabold text-[#162a36] mb-3"
                htmlFor="building-input"
              >
                What are you building?
              </label>
              {/* Text Input Field */}
              <input
                className="w-full bg-[#fcf9ef] text-[#2c3e46] placeholder-[#8c8273] border border-[#cebfa2] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#136c64] focus:border-transparent transition mb-4 shadow-inner font-medium"
                id="building-input"
                placeholder="e.g. Launch my product and get my first 100 users"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && go()}
                autoFocus
              />
              {/* Action Button */}
              <button
                onClick={go}
                disabled={!goal.trim()}
                className="w-full bg-[#136c53] hover:bg-[#0f5944] active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-[#0d4f3d] shadow-[0_3px_0_#093b2d] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Let’s Build →</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Highlights Banner */}
      <footer className="relative z-10 px-6 pb-6 w-full max-w-6xl mx-auto" data-purpose="features-bar">
        <div className="bg-[#fefaf0]/95 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-[#cebfa2]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-[#dfd0b2] gap-4 lg:gap-0">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`flex flex-col items-center text-center px-4 ${
                  i > 0 ? "pt-3 sm:pt-0" : "pt-1 sm:pt-0"
                }`}
              >
                <div className="w-9 h-9 mb-2 flex items-center justify-center text-2xl">
                  {f.icon}
                </div>
                <h3 className="font-extrabold text-[#112d3b] text-sm tracking-tight mb-1">
                  {f.title}
                </h3>
                <p className="text-xs text-[#524434] leading-relaxed font-semibold">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
