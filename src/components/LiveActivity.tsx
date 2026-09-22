"use client";

import { useEffect, useState } from "react";
import { Card, Badge, DemoTag, PixelButton } from "./ui";

// Live Activity (spec §8 Home) — driven entirely by the SSE event stream
// from /api/companies/:id/events, plus pending hire approvals.

interface LiveEvent {
  id: string;
  type: string;
  actorName: string | null;
  title: string;
  detail: string | null;
  createdAt: string;
  payload?: Record<string, unknown>;
}

interface HireRequest {
  id: string;
  providerName: string;
  serviceType: string;
  priceCents: number;
  taskId: string;
  reasons: string;
}

const ICONS: Record<string, string> = {
  TASK_CREATED: "📋",
  TASK_ASSIGNED: "🧩",
  TASK_STARTED: "⚙️",
  CAPABILITY_GAP_DETECTED: "🚨",
  SERVICE_DISCOVERY_STARTED: "🔎",
  SERVICE_DISCOVERY_COMPLETED: "🛒",
  PROVIDER_SELECTED: "✅",
  EXTERNAL_TASK_CREATED: "🤝",
  PAYMENT_QUOTED: "🧾",
  PAYMENT_STARTED: "💳",
  EXTERNAL_TASK_DELIVERED: "📦",
  VERIFICATION_STARTED: "🛡️",
  VERIFICATION_PASSED: "✔️",
  VERIFICATION_FAILED: "✖️",
  PAYMENT_SETTLED: "💰",
  MEMORY_CREATED: "🧠",
  REPUTATION_UPDATED: "⭐",
  MISSION_COMPLETED: "🏆",
};

export function useLiveEvents(companyId: string) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    const es = new EventSource(`/api/companies/${companyId}/events`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (m) => {
      try {
        const msg = JSON.parse(m.data) as { kind: string; events?: LiveEvent[]; event?: LiveEvent };
        if (msg.kind === "history" && msg.events) setEvents(msg.events);
        if (msg.kind === "live" && msg.event)
          setEvents((prev) => [...prev.slice(-80), msg.event!]);
      } catch {
        /* ignore malformed frame */
      }
    };
    return () => es.close();
  }, [companyId]);

  return { events, connected };
}

export function LiveActivity({ companyId }: { companyId: string }) {
  const { events, connected } = useLiveEvents(companyId);
  const [pending, setPending] = useState<HireRequest[]>([]);

  useEffect(() => {
    if (!companyId) return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/hire-requests?companyId=${companyId}`);
        const data = (await res.json()) as { pending: HireRequest[] };
        if (!stop) setPending(data.pending ?? []);
      } catch {
        /* noop */
      }
    };
    poll();
    const t = setInterval(poll, 2500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [companyId, events.length]);

  const decide = async (hireId: string, approved: boolean) => {
    await fetch("/api/hire-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hireId, approved }),
    });
    setPending((p) => p.filter((h) => h.id !== hireId));
  };

  return (
    <div className="space-y-3">
      {pending.map((h) => (
        <Card key={h.id} className="p-3 border-gold" >
          <div className="flex items-center gap-2 mb-2">
            <Badge color="gold">Hiring request</Badge>
            <DemoTag />
          </div>
          <div className="text-sm font-semibold">
            Hire {h.providerName} ({h.serviceType}) for {(h.priceCents / 100).toFixed(2)} USD₮0?
          </div>
          <ul className="text-xs text-ink-soft mt-1.5 list-disc list-inside space-y-0.5">
            {(JSON.parse(h.reasons || "[]") as string[]).slice(0, 3).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <div className="flex gap-2 mt-3">
            <PixelButton variant="primary" className="!text-[9px] !py-2" onClick={() => decide(h.id, true)}>
              Approve hire
            </PixelButton>
            <PixelButton variant="ghost" className="!text-[9px] !py-2" onClick={() => decide(h.id, false)}>
              Decline
            </PixelButton>
          </div>
        </Card>
      ))}

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-[#14332933] bg-parchment">
          <span className={`w-2 h-2 rounded-sm ${connected ? "bg-leaf animate-pulse-soft" : "bg-danger"}`} />
          <span className="pixel-label">Live Activity</span>
          <span className="ml-auto text-[10px] text-ink-soft">{events.length} events</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto pixel-scroll divide-y divide-[#14332922]">
          {events.length === 0 ? (
            <div className="p-4 text-sm text-ink-soft">No activity yet — launch a mission to see agents work.</div>
          ) : (
            [...events].reverse().map((e) => (
              <div key={e.id} className="flex gap-2.5 px-3 py-2.5 items-start">
                <span className="text-base leading-none mt-0.5" aria-hidden>
                  {ICONS[e.type] ?? "•"}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium leading-snug">{e.title}</div>
                  {e.detail ? <div className="text-xs text-ink-soft mt-0.5 break-words">{e.detail}</div> : null}
                  <div className="text-[10px] text-ink-soft mt-0.5 opacity-70">
                    {e.actorName ?? "System"} · {new Date(e.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
