"use client";

import { useCallback, useEffect, useState } from "react";
import { AgentSprite } from "@/components/PixelSprite";

// Human-in-the-loop hire approvals (spec §8 autonomy policy).
// While the CEO engine waits (120s window), this banner surfaces the pending
// OKX AI marketplace hire on every page so the founder can approve in place —
// no digging, no missed hires, no silent expiries.

interface HireRequest {
  id: string;
  providerName: string;
  serviceType: string;
  priceCents: number;
  reasons: string;
}

const REASONS_CACHE_TTL_MS = 2500;

export function HireApprovalBanner() {
  const [hire, setHire] = useState<HireRequest | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [outcome, setOutcome] = useState<"approved" | "declined" | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);

  const poll = useCallback(async () => {
    try {
      const c = await fetch("/api/companies");
      if (!c.ok) return;
      const cj = (await c.json()) as { company?: { id: string } };
      if (!cj.company?.id) return;
      const h = await fetch(`/api/hire-requests?companyId=${cj.company.id}`);
      if (!h.ok) return;
      const hj = (await h.json()) as { pending?: HireRequest[] };
      const next = hj.pending?.[0] ?? null;
      setHire((prev) => {
        if (next && prev?.id !== next.id) {
          try {
            const parsed = JSON.parse(next.reasons) as string[];
            setReasons(Array.isArray(parsed) ? parsed : []);
          } catch {
            setReasons([]);
          }
          setOutcome(null);
        }
        return next;
      });
    } catch {
      /* network hiccup — retry on next tick */
    }
  }, []);

  useEffect(() => {
    // Slightly faster than the engine's 120s decision window so the banner is
    // guaranteed to appear well before expiry.
    poll();
    const t = setInterval(poll, REASONS_CACHE_TTL_MS);
    return () => clearInterval(t);
  }, [poll]);

  // Freeze the banner while an outcome toast is showing (the engine's poll
  // would otherwise re-insert the just-decided hire if the SSE row lags).
  useEffect(() => {
    if (!outcome) return;
    const t = setTimeout(() => setOutcome(null), 5000);
    return () => clearTimeout(t);
  }, [outcome]);

  const decide = async (approved: boolean) => {
    if (!hire || deciding) return;
    setDeciding(true);
    try {
      const r = await fetch("/api/hire-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hireId: hire.id, approved }),
      });
      if (r.ok) {
        // Keep the banner pinned with "working" state until the engine's
        // long-poll (0.9s cadence) observes the decision — don't clear it
        // optimistically, or the poll re-renders it back.
        setOutcome(approved ? "approved" : "declined");
        setHire(null);
      }
    } finally {
      setDeciding(false);
    }
  };

  if (!hire && !outcome) return null;

  return (
    <div className="px-4 md:px-5 pt-4" data-purpose="hire-approval">
      {hire && (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-md flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <AgentSprite role="EXTERNAL" size={24} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">
                OKX AI hire needs your approval
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase tracking-wide animate-pulse">
                Waiting · expires in ~2 min
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              The CEO wants to hire <span className="font-bold text-slate-900">{hire.providerName}</span>{" "}
              <span className="text-slate-400">({hire.serviceType})</span> for{" "}
              <span className="font-bold text-emerald-700">
                {(hire.priceCents / 100).toFixed(2)} USDT
              </span>
              {reasons.length > 0 && <> — {reasons[0]}</>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => decide(false)}
              disabled={deciding}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={() => decide(true)}
              disabled={deciding}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#006050] hover:bg-[#004d40] text-white shadow transition disabled:opacity-50"
            >
              {deciding ? "Deciding…" : "Approve & Pay"}
            </button>
          </div>
        </div>
      )}
      {outcome && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm border ${
            outcome === "approved"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-slate-100 border-slate-200 text-slate-600"
          }`}
        >
          {outcome === "approved"
            ? "✓ Hire approved — settling payment on X Layer and assigning the task…"
            : "Hire declined — the CEO assigned the task to the internal team."}
        </div>
      )}
    </div>
  );
}
