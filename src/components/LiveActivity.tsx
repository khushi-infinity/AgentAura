"use client";

import { useEffect, useState } from "react";
import { Card, Badge, DemoTag, PixelButton } from "./ui";
import { PixelSprite } from "./PixelSprite";

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

// Event type → pixel glyph (no emoji; sprite language is consistent).
const ICONS: Record<string, string> = {
  TASK_CREATED: "missions",
  TASK_ASSIGNED: "agents",
  TASK_STARTED: "settings",
  CAPABILITY_GAP_DETECTED: "alert",
  SERVICE_DISCOVERY_STARTED: "RESEARCH",
  SERVICE_DISCOVERY_COMPLETED: "marketplace",
  PROVIDER_SELECTED: "check",
  EXTERNAL_TASK_CREATED: "send",
  PAYMENT_QUOTED: "receipt",
  PAYMENT_STARTED: "wallet",
  EXTERNAL_TASK_DELIVERED: "marketplace",
  VERIFICATION_STARTED: "VERIFICATION",
  VERIFICATION_PASSED: "check",
  VERIFICATION_FAILED: "cross",
  PAYMENT_SETTLED: "wallet",
  MEMORY_CREATED: "memory",
  REPUTATION_UPDATED: "star",
  MISSION_COMPLETED: "flag",
};

// Tone: failure red, money gold, everything else verified-green.
function toneFor(type: string): string {
  if (type.includes("FAILED")) return "text-danger";
  if (type.startsWith("PAYMENT")) return "text-gold-deep";
  if (type === "CAPABILITY_GAP_DETECTED") return "text-gold-deep";
  return "text-leaf-deep";
}

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

export function LiveActivity({
  companyId,
  fill = false,
}: {
  companyId: string;
  /** Stretch to the parent's height and scroll internally (dashboard columns). */
  fill?: boolean;
}) {
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
    <div className={fill ? "h-full min-h-0 flex flex-col gap-3" : "space-y-3"}>
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

      <Card className={`p-0 overflow-hidden ${fill ? "flex-1 min-h-0 flex flex-col" : ""}`}>
        <div className="pixel-card-head shrink-0">
          <span className={`w-2 h-2 ${connected ? "bg-leaf-bright animate-pulse-soft" : "bg-danger"}`} />
          <span>Live Activity</span>
          <span className="ml-auto normal-case opacity-80">{events.length} events</span>
        </div>
        <div
          className={`overflow-y-auto pixel-scroll divide-y divide-[#0f2b3322] ${
            fill ? "flex-1 min-h-0" : "max-h-[560px]"
          }`}
        >
          {events.length === 0 ? (
            <div className="p-4 text-sm text-ink-soft">No activity yet — launch a mission to see agents work.</div>
          ) : (
            [...events].reverse().map((e) => (
              <div key={e.id} className="flex gap-2.5 px-3 py-2.5 items-start">
                <span className={`shrink-0 mt-0.5 ${toneFor(e.type)}`} aria-hidden>
                  <PixelSprite name={ICONS[e.type] ?? "analytics"} size={16} />
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
