"use client";

import { useEffect, useState } from "react";
import { Card, Badge, DemoTag, EmptyState } from "@/components/ui";
import { Hero, PixelScenery } from "@/components/AppShell";

// Wallet (spec §8): totals, escrow, earned/spent, recent agent
// transactions with tx references. Demo transactions are labeled (§18).

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

interface Payment {
  id: string;
  providerName: string;
  amountCents: number;
  status: string;
  method: string;
  escrowed: boolean;
  txHash: string | null;
  isDemo: boolean;
  createdAt: string;
}

const KIND_ICON: Record<string, string> = {
  EXTERNAL_PAYMENT: "🌐",
  AGENT_PAYMENT: "🤖",
  MISSION_FUNDING: "🏦",
  TASK_REWARD: "🏅",
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        setWallet(d.wallet ?? null);
        setTxs(d.transactions ?? []);
        setPays(d.payments ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (c: number) => (c / 100).toFixed(2);
  const maxBar = Math.max(1, ...txs.map((t) => Math.abs(t.amountCents)));

  return (
    <div>
      <Hero
        title="Wallet"
        subtitle="Manage your funds, spending and agent transactions"
        art={<PixelScenery variant="lake" />}
      />
      <div className="p-6 space-y-5">
        {loading ? (
          <div className="text-ink-soft text-sm">Loading wallet…</div>
        ) : !wallet ? (
          <EmptyState icon="💰" title="No wallet yet" hint="Create a company to get a treasury wallet." />
        ) : (
          <>
            {/* Balance cards */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-[#2e7d4f] to-[#256741] !border-[#143329]">
                <div className="pixel-label text-cream/80">Total Balance</div>
                <div className="font-pixel text-lg text-cream mt-2">{fmt(wallet.totalCents)} USD₮0</div>
                <div className="text-cream/70 text-xs mt-1">≈ ${(wallet.totalCents / 100).toFixed(2)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="pixel-label bg-[#14332955] text-cream px-1.5 py-1 rounded-sm">x Layer</span>
                  {wallet.isDemo ? <DemoTag className="!bg-[#14332955] !text-cream !border-cream/40" /> : null}
                </div>
              </Card>
              <Card className="p-4">
                <div className="pixel-label text-ink-soft">Available</div>
                <div className="font-pixel text-base mt-2">{fmt(wallet.availableCents)}</div>
                <div className="text-xs text-ink-soft mt-1">ready to spend</div>
              </Card>
              <Card className="p-4">
                <div className="pixel-label text-ink-soft">In Escrow</div>
                <div className="font-pixel text-base mt-2 text-gold-deep">{fmt(wallet.escrowCents)}</div>
                <div className="text-xs text-ink-soft mt-1">A2A tasks awaiting acceptance</div>
              </Card>
              <Card className="p-4">
                <div className="pixel-label text-ink-soft">Total Spent</div>
                <div className="font-pixel text-base mt-2 text-danger">{fmt(wallet.spentCents)}</div>
                <div className="text-xs text-ink-soft mt-1">earned {fmt(wallet.earnedCents)}</div>
              </Card>
            </div>

            <div className="grid xl:grid-cols-[1.3fr_1fr] gap-5 items-start">
              {/* Transactions */}
              <Card className="p-0 overflow-hidden">
                <div className="px-4 py-3 border-b-2 border-[#14332933] bg-parchment flex items-center gap-2">
                  <span className="font-pixel text-[10px]">Recent Agent Transactions</span>
                  <DemoTag />
                </div>
                <div className="divide-y divide-[#14332922]">
                  {txs.length === 0 ? (
                    <div className="p-4 text-sm text-ink-soft">No transactions yet — launch a mission.</div>
                  ) : (
                    txs.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-lg" aria-hidden>{KIND_ICON[t.kind] ?? "💸"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {t.direction === "OUT" ? "Payment to" : "Received from"} {t.counterparty}
                          </div>
                          <div className="text-xs text-ink-soft truncate">{t.memo}</div>
                          {t.txHash ? (
                            <div className="text-[10px] text-ink-soft opacity-70 truncate font-mono" title={t.isDemo ? "Simulated tx — not onchain" : "Onchain reference"}>
                              {t.isDemo ? "sim · " : "tx · "}{t.txHash}
                            </div>
                          ) : null}
                        </div>
                        <div className={`font-pixel text-[10px] ${t.direction === "OUT" ? "text-danger" : "text-leaf-deep"}`}>
                          {t.direction === "OUT" ? "-" : "+"}
                          {fmt(t.amountCents)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Settlements + flow bars */}
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="font-pixel text-[10px] mb-3">Earnings vs Spending</div>
                  <div className="space-y-2">
                    {txs.slice(0, 10).map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-6 ${t.direction === "OUT" ? "bg-danger" : "bg-leaf"}`} />
                        <div className="flex-1 h-6 bg-parchment2 border border-[#14332933] rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${t.direction === "OUT" ? "bg-danger/70" : "bg-leaf/70"}`}
                            style={{ width: `${Math.max(6, (Math.abs(t.amountCents) / maxBar) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-soft w-14 text-right">{fmt(t.amountCents)}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="font-pixel text-[10px] mb-3">Settlements (x402)</div>
                  {pays.length === 0 ? (
                    <div className="text-xs text-ink-soft">No settlements yet.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {pays.slice(0, 6).map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <Badge color={p.status === "SETTLED" ? "leaf" : "gold"}>{p.status.toLowerCase()}</Badge>
                          <span className="truncate flex-1">
                            {p.providerName} · {p.method}
                            {p.escrowed ? " (escrow)" : ""}
                          </span>
                          <span className="font-medium">{fmt(p.amountCents)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
