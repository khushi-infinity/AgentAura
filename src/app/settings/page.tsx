"use client";

import { useEffect, useState } from "react";

interface Config {
  demoMode: boolean;
  llmConfigured: boolean;
  llmModel: string;
  network: string;
  founderName?: string;
}

const TABS = ["Profile", "Team", "Integrations", "Preferences", "Security", "Billing"];

export default function SettingsPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState("Profile");
  // Founder identity lives on the company row — loaded from /api/config,
  // saved via PATCH /api/companies, reflected app-wide instantly.
  const [name, setName] = useState("Jane Doe");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [email, setEmail] = useState("jane@agentaura.app");
  const [policy, setPolicy] = useState("AUTO_HIRE_BELOW_BUDGET");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d: Config) => {
        setCfg(d);
        if (d.founderName) {
          setName(d.founderName);
          setNameLoaded(true);
        }
      })
      .catch(() => setCfg(null));
  }, []);

  const saveProfile = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await fetch("/api/companies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ founderName: trimmed }),
    }).catch(() => {});
    // Instant propagation: sidebar listens for this, other tabs poll /api/config.
    window.dispatchEvent(
      new CustomEvent("agentaura:founder-changed", { detail: { founderName: trimmed } }),
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="flex-1 bg-[#EEF5F6] flex flex-col overflow-y-auto">
      {/* Top Hero Pixel Art Banner */}
      <header
        className="relative w-full h-44 overflow-hidden border-b border-emerald-950/20 shadow-inner flex items-center px-8 shrink-0"
        style={{
          backgroundImage: `url('/banners/forest.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/60 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full flex items-center justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#032e3a] tracking-tight">
              Settings
            </h2>
            <p className="text-xs lg:text-sm font-semibold text-[#004e5d] mt-1">
              Customize your workspace, team and preferences.
            </p>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-white/95 backdrop-blur-sm border border-emerald-600/30 px-4 py-2 rounded-xl shadow-md flex items-center space-x-2.5">
              <span className="text-emerald-600 font-bold">✦</span>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                "A well-configured team builds faster."
              </p>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center bg-[#8b4513] border-2 border-[#5c2e0b] px-3.5 py-1.5 rounded-lg shadow text-amber-100 font-bold text-[10px] uppercase tracking-wider text-center">
              <span>Configure.</span>
              <span className="text-amber-300">Create more.</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="px-6 lg:px-8 pt-4 pb-3 border-b border-slate-200 bg-white">
        <nav className="flex space-x-2 text-xs font-semibold text-slate-600 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === t
                  ? "border border-teal-800/20 bg-teal-50 text-[#004d40] font-bold shadow-xs"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Grid Content */}
      <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left Column: Profile Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#003138]">Profile Information</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage your founder information and preferences.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-emerald-500/30 flex items-center justify-center text-3xl shadow-sm">
                👧🏻
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{nameLoaded ? name : "Jane Doe"}</div>
                <div className="text-xs text-slate-500">Founder · AgentAura</div>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Settlement Network</label>
                <select
                  defaultValue="xlayer-testnet"
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="xlayer-testnet">OKX X Layer Testnet (Chain ID 1952)</option>
                  <option value="xlayer-mainnet" disabled>OKX X Layer Mainnet (Production)</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={saveProfile}
                className="px-4 py-2.5 bg-[#006050] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl shadow transition"
              >
                {saved ? "Changes Saved ✓" : "Save Changes"}
              </button>
            </div>
          </section>

          {/* Autonomy Controls */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#003138]">Autonomy Controls</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure when agents can hire and spend treasury funds.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: "MANUAL_APPROVAL", title: "Ask before hiring", desc: "Every external agent hire requires founder approval" },
                { id: "AUTO_HIRE_BELOW_BUDGET", title: "Autonomous within budget", desc: "Agents hire within available treasury funds" },
                { id: "FULL_AUTONOMY", title: "Full Autonomy", desc: "No approval gates; complete autonomous execution" },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    policy === opt.id
                      ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-500"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="autonomy"
                    checked={policy === opt.id}
                    onChange={() => setPolicy(opt.id)}
                    className="mt-0.5 text-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{opt.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Integrations & Status (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#003138]">Integration Status</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">OKX.AI Provider</div>
                  <div className="text-[11px] text-slate-500">Agent marketplace protocol</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">OKX X Layer Testnet</div>
                  <div className="text-[11px] text-slate-500">Chain ID 196 (Testnet)</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Agentic Smart Wallet</div>
                  <div className="text-[11px] text-slate-500">Contract escrow settlement</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Ready
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">LLM Reasoning Engine</div>
                  <div className="text-[11px] text-slate-500">{cfg?.llmModel || "OpenAI-compatible adapter"}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                  Online
                </span>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-[#012627] to-[#033b3c] text-white rounded-2xl p-5 border border-[#0d4a4d] shadow-md space-y-2.5 text-xs">
            <h4 className="font-bold text-emerald-300">Security &amp; Secret Isolation</h4>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              All OKX API credentials and private keys remain strictly server-side in accordance with spec §17. No keys are ever exposed in client bundles or network traffic.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
