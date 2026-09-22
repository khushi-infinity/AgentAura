"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { RobotMascot, WelcomeScene, WoodSign } from "@/components/WelcomeScene";

// Welcome / onboarding (spec §8), composed to the supplied reference:
//   - full-bleed pixel landscape behind everything
//   - quote card top-right, wooden signpost mid-right, robot mascot mid-left
//   - centred "Welcome to AgentAura" heading, then the goal card
//   - a four-column value bar pinned along the bottom

const FEATURES = [
  { icon: "agents", title: "AI Agents", desc: "Plan, delegate, hire and get work done." },
  {
    icon: "target",
    title: "Real Expertise",
    desc: "Access specialized agents from the marketplace.",
  },
  {
    icon: "settings",
    title: "Autonomous Execution",
    desc: "Let your agents work together toward your goals.",
  },
  {
    icon: "analytics",
    title: "Real Economic Value",
    desc: "Agents transact securely using OKX and the X Layer.",
  },
];

// Four-point sparkle for the quote card.
const SPARKLE = [
  "...##...",
  "...##...",
  ".#.##.#.",
  "########",
  "########",
  ".#.##.#.",
  "...##...",
  "...##...",
];

/** Divider rules for the value bar: 4-up on lg, 2-up on smaller screens. */
function dividerClass(i: number) {
  return [
    i === 1 || i === 3 ? "border-l" : "",
    i >= 2 ? "border-t lg:border-t-0" : "",
    i >= 1 ? "lg:border-l" : "",
    "border-[#ded2b6]",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");

  const go = () => {
    const q = goal.trim() ? `?goal=${encodeURIComponent(goal.trim())}` : "";
    router.push(`/create${q}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Full-bleed scenery ── */}
      <div className="absolute inset-0" aria-hidden>
        <WelcomeScene />
      </div>

      {/* ── Robot mascot on the mossy ruins (mid-left) ── */}
      <div
        className="pointer-events-none absolute left-[2%] bottom-[29%] w-[17%] max-w-[250px] min-w-[130px] hidden sm:block"
        aria-hidden
      >
        <RobotMascot className="w-full h-auto" />
      </div>

      {/* ── Wooden signpost (mid-right) ── */}
      <div
        className="pointer-events-none absolute right-[3%] bottom-[25%] w-[16%] max-w-[240px] min-w-[120px] hidden xl:block"
        aria-hidden
      >
        <WoodSign className="w-full h-auto" />
      </div>

      {/* ── Quote card (top-right) ── */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 hidden md:flex items-start gap-3 rounded-lg bg-[#f5efdf] border-2 border-[#ded2b6] px-4 py-3 max-w-[280px] shadow-[0_6px_0_0_rgba(20,40,28,0.16)]">
        <span className="text-[#2f6b45] mt-0.5" aria-hidden>
          <PixelSprite glyph={SPARKLE} size={18} />
        </span>
        <p className="font-body italic text-[15px] leading-snug text-[#24352b]">
          Ideas are cheap. Execution compounds.
        </p>
      </div>

      {/* ── Centred welcome content ── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-[6vh] pb-[27vh]">
        <h1 className="font-body font-extrabold tracking-tight text-center text-[30px] sm:text-[38px] lg:text-[46px] leading-[1.1] text-[#16261d] drop-shadow-[0_2px_0_rgba(255,255,255,0.55)]">
          Welcome to <span className="text-[#2f6b45]">AgentAura</span>
        </h1>
        <p className="mt-3 text-center text-[15px] sm:text-[18px] text-[#2c4034] max-w-[720px]">
          Turn your ideas into outcomes with an AI workforce.
        </p>

        <div className="welcome-card w-full max-w-[460px] mt-7 sm:mt-9 p-5 sm:p-7">
          <h2 className="text-[16px] sm:text-[17px] font-bold text-[#16261d]">
            What are you building?
          </h2>
          <label htmlFor="goal" className="sr-only">
            What are you building?
          </label>
          <input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
            }}
            placeholder="e.g. Launch my product and get my first 100 users"
            className="mt-3 w-full rounded-lg border-2 border-[#ded2b6] bg-[#fbf7ec] px-4 py-3 text-[14px] text-[#16261d] placeholder:text-[#8d8a7c] focus:outline-none focus:border-[#3f7d5a]"
          />
          <button
            type="button"
            onClick={go}
            className="mt-4 w-full rounded-lg bg-[#3f7d5a] hover:bg-[#4a8f66] text-[#f5efdf] text-[16px] font-semibold py-3.5 transition-colors shadow-[0_3px_0_0_rgba(20,40,28,0.35)] active:translate-y-[2px] active:shadow-none"
          >
            Let&apos;s Build →
          </button>
        </div>
      </div>

      {/* ── Four-column value bar (pinned to the bottom) ── */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#f5efdf] border-t-2 border-[#ded2b6]">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`px-4 sm:px-6 py-5 text-center ${dividerClass(i)}`}>
              <span className="inline-flex text-[#2f6b45]" aria-hidden>
                <PixelSprite name={f.icon} size={24} />
              </span>
              <div className="mt-2 text-[15px] font-bold text-[#16261d]">{f.title}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-[#4a5d51]">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
