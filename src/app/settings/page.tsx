"use client";

import { PixelSprite, AGENT_MARK } from "@/components/PixelSprite";

import { useEffect, useState } from "react";
import { Card, Badge, PixelButton, DemoTag } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";

// Settings (spec §8): profile, autonomy controls, integration status for
// OKX AI / Agentic Wallet / LLM. Secrets stay server-side (spec §17/§19) —
// this page only shows status, never key material.

interface Config {
  demoMode: boolean;
  llmConfigured: boolean;
  llmModel: string;
  network: string;
}

export default function SettingsPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [policy, setPolicy] = useState("AUTO_HIRE_BELOW_BUDGET");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  return (
    <div>
      <Hero
        title="Settings"
        subtitle="Customize your experience and integrations"
        art={<PixelScenery variant="meadow" />}
      />
      <div className="p-6 grid xl:grid-cols-2 gap-5 items-start">
        {/* Profile */}
        <Card className="p-4">
          <div className="font-pixel text-[10px] mb-3">Profile</div>
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 bg-parchment border-2 border-[#0f2b33] rounded-sm flex items-center justify-center text-2xl" aria-hidden>
              <PixelSprite glyph={AGENT_MARK} size={26} />
            </span>
            <div>
              <div className="text-sm font-semibold">Khushi Sarawagi</div>
              <div className="text-xs text-ink-soft">Founder · AgentAura</div>
            </div>
          </div>
          <div className="pixel-rule my-4" />
          <div className="space-y-3">
            <label className="block">
              <span className="pixel-label block mb-1.5">Display name</span>
              <input
                defaultValue="Khushi Sarawagi"
                className="w-full border-2 border-[#0f2b33] bg-parchment rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-leaf"
              />
            </label>
            <label className="block">
              <span className="pixel-label block mb-1.5">Default network</span>
              <select className="w-full border-2 border-[#0f2b33] bg-parchment rounded-sm px-3 py-2.5 text-sm" defaultValue="xlayer-testnet">
                <option value="xlayer-testnet">X Layer Testnet (free, for demos)</option>
                <option value="xlayer-mainnet" disabled>X Layer Mainnet (requires funds)</option>
              </select>
            </label>
          </div>
          <PixelButton
            variant="gold"
            className="mt-4"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
          >
            {saved ? "Saved" : "Save Changes"}
          </PixelButton>
        </Card>

        {/* Autonomy */}
        <Card className="p-4">
          <div className="font-pixel text-[10px] mb-3">Autonomy Controls</div>
          <p className="text-xs text-ink-soft mb-3">
            Budget limits and approval policies are enforced server-side (spec §19).
          </p>
          <div className="space-y-2">
            {[
              { id: "ASK_BEFORE_HIRING", label: "Ask before hiring", hint: "Every external hire needs your approval" },
              { id: "AUTO_HIRE_BELOW_BUDGET", label: "Auto-hire under budget", hint: "Agents hire freely within budget caps" },
              { id: "FULLY_AUTONOMOUS", label: "Fully autonomous", hint: "No approval gates" },
            ].map((o) => (
              <label
                key={o.id}
                className={`flex items-center gap-3 border-2 rounded-sm px-3 py-2.5 cursor-pointer ${
                  policy === o.id ? "border-leaf bg-[#ddf0e6]" : "border-[#0f2b3355] bg-parchment"
                }`}
              >
                <input type="radio" name="policy" checked={policy === o.id} onChange={() => setPolicy(o.id)} className="accent-[#007755]" />
                <span>
                  <span className="text-sm font-medium block">{o.label}</span>
                  <span className="text-xs text-ink-soft">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        {/* Integrations */}
        <Card className="p-4">
          <div className="font-pixel text-[10px] mb-3">Integrations</div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={cfg?.demoMode ? "gold" : "leaf"}>OKX AI · {cfg?.demoMode ? "simulated" : "live"}</Badge>
              {cfg?.demoMode ? <DemoTag /> : null}
              <span className="text-xs text-ink-soft">
                {cfg?.demoMode
                  ? "DEMO_MODE is ON — discovery/hiring/settlement are simulated through the same interfaces."
                  : "Live OKX.AI path enabled."}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={cfg?.llmConfigured ? "leaf" : "muted"}>
                LLM · {cfg?.llmConfigured ? cfg.llmModel : "not configured"}
              </Badge>
              <span className="text-xs text-ink-soft">
                {cfg?.llmConfigured ? "OpenAI-compatible provider connected." : "Running in deterministic mode — add an API key in .env.local."}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="gold">Agentic Wallet · Onchain OS</Badge>
              <span className="text-xs text-ink-soft">
                Connect via `npx -y @okxweb3/onchainos-installer install` then `onchainos wallet login`.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="teal">Network · {cfg?.network ?? "xlayer-testnet"}</Badge>
              <span className="text-xs text-ink-soft">Test OKB (gas) + test USD₮0 from the X Layer faucet.</span>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-4">
          <div className="font-pixel text-[10px] mb-3">Security</div>
          <ul className="text-xs text-ink-soft space-y-2 list-disc list-inside">
            <li>API keys and private keys are never exposed to the browser — all provider calls run server-side.</li>
            <li>External agent output is treated as untrusted input and schema-checked before use.</li>
            <li>Settlement uses idempotent task references; simulated transactions are always labeled.</li>
            <li>Budget limits enforced server-side before any hire is submitted.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
