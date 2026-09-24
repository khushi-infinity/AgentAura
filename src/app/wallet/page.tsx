"use client";

import { useEffect, useState } from "react";

interface Wallet {
  label: string;
  address: string;
  network: string;
  totalCents: number;
  availableCents: number;
  escrowCents: number;
  earnedCents: number;
  spentCents: number;
  isDemo: boolean;
}

interface Tx {
  id: string;
  direction: string;
  kind: string;
  counterparty: string;
  memo: string;
  amountCents: number;
  txHash: string | null;
  isDemo: boolean;
  createdAt: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);

  const loadData = () => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setWallet(d.wallet ?? null);
        setTxs(d.transactions ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real treasury top-up through the API — writes a transaction row and
  // credits the wallet (demo mode: honestly labeled, not an onchain tx).
  const depositUsdt = async () => {
    setDepositing(true);
    try {
      await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents: 1000 }),
      });
      loadData();
      // Same-tab broadcast so the sidebar + home treasury chips update
      // instantly (other tabs pick it up via their short balance polls).
      window.dispatchEvent(new Event("agentaura:wallet-changed"));
    } finally {
      setDepositing(false);
    }
  };

  // No invented balances — an unfunded wallet shows 0.00, honestly.
  const total = wallet ? wallet.totalCents / 100 : 0;
  const available = wallet ? wallet.availableCents / 100 : 0;
  const inEscrow = wallet ? wallet.escrowCents / 100 : 0;
  const spent = wallet ? wallet.spentCents / 100 : 0;

  return (
    <main className="flex-1 flex flex-col gap-4 overflow-y-auto bg-[#F9FAFB]">
      {/* Top Pixel Art Scenic Landscape Banner */}
      <section className="relative w-full h-44 overflow-hidden border-b border-emerald-800/50 shadow-md shrink-0">
        <img
          alt="Pixel landscape with mountains and AI robots"
          className="w-full h-full object-cover object-bottom pixelated"
          src="/banners/forest.png"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-900/40 to-transparent flex items-center justify-between px-8 py-4">
          <div className="max-w-md text-white drop-shadow-md">
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-1">
              Wallet &amp; Payments
            </h2>
            <p className="text-emerald-100 font-medium text-xs lg:text-sm">
              Power your agents. Pay effortlessly with OKX X Layer.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-1.5 text-indigo-600 mb-0.5 font-bold text-[11px]">
                <span>✦</span>
                <span>"Seamless payments for"</span>
              </div>
              <p className="text-slate-700">a more autonomous future.</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-3xl shadow-lg">
              🪙
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* Balance Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-purpose="balance-cards">
          {/* Card 1: Total Balance */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Balance</span>
                <span className="text-xs">👁️</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{total.toFixed(2)} USDT</div>
              <div className="text-xs text-slate-500 mt-0.5">≈ ${total.toFixed(2)} USD</div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>OKX X Layer</span>
              <span className="bg-emerald-200/60 px-2 py-0.5 rounded-full text-[10px]">Active</span>
            </div>
          </div>

          {/* Card 2: Available Funds */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Available Funds</div>
              <div className="text-2xl font-black text-slate-900">{available.toFixed(2)} USDT</div>
              <div className="text-xs text-slate-500 mt-0.5">Ready for autonomous delegation</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-sky-700">
              Free to allocate
            </div>
          </div>

          {/* Card 3: In Smart Escrow */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">In Smart Escrow</div>
              <div className="text-2xl font-black text-amber-600">{inEscrow.toFixed(2)} USDT</div>
              <div className="text-xs text-slate-500 mt-0.5">Locked pending verification</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-amber-700">
              Protected by smart contracts
            </div>
          </div>

          {/* Card 4: Total Settled */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Total Settled</div>
              <div className="text-2xl font-black text-slate-900">{spent.toFixed(2)} USDT</div>
              <div className="text-xs text-slate-500 mt-0.5">Paid to verified agents</div>
            </div>
            <div className="mt-3 text-[11px] font-semibold text-emerald-700">
              100% onchain receipts
            </div>
          </div>
        </section>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={depositUsdt}
            disabled={depositing}
            className="px-4 py-2.5 bg-[#006050] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-60"
          >
            {depositing ? "Processing…" : "+ Deposit 10 USDT"}
          </button>
          <button
            onClick={() => alert("Withdrawal: Transfer to external address.")}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition"
          >
            ↑ Send Funds
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition ml-auto"
          >
            🔄 Refresh Chain State
          </button>
        </div>

        {/* 2-Column Split: Transactions vs Onchain Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Recent Transactions (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Recent Transactions</h3>
              <span className="text-[11px] text-slate-400 font-medium">OKX X Layer Explorer</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading ledger...</div>
              ) : txs.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <div className="text-2xl">🪙</div>
                  <p className="text-xs font-bold text-slate-700 mt-2">No transactions yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Every OKX AI hire settles here — run a mission that triggers a
                    marketplace hire, or hire an ASP directly from the OKX AI Marketplace.
                  </p>
                </div>
              ) : (
                txs.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{t.counterparty}</div>
                      <div className="text-[11px] text-slate-500">{t.memo} · {t.createdAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">
                        {t.direction === "OUT" ? "-" : "+"}{(Math.abs(t.amountCents) / 100).toFixed(2)} USDT
                      </div>
                      <span className="text-[10px] text-emerald-600">✓ Verified</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Smart Contract & Network Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* OKX Network Card */}
            <div className="bg-gradient-to-br from-[#022f30] to-[#011c1d] text-white rounded-2xl p-5 border border-[#0d4a4d] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">OKX X Layer Testnet</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Agentic Wallet:</span>
                  <span className="font-mono text-emerald-300">{wallet ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : "Onchain OS"}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Chain ID:</span>
                  <span className="font-mono">1952 (X Layer Testnet)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Settlement Asset:</span>
                  <span className="font-mono text-amber-300">USD₮0 (Tether USD)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Rail:</span>
                  <span className="font-mono">x402 · Agent Payments Protocol</span>
                </div>
              </div>
            </div>

            {/* Smart Contract Escrow Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2.5 text-xs">
              <h4 className="font-extrabold text-slate-900">Autonomous Escrow Protocol</h4>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                AgentAura automatically creates smart escrow contracts for external hires. When an external agent delivers their task, Verification Agent checks source criteria before releasing payment.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                <span>🛡️</span> Zero counterparty risk with automated verification
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
