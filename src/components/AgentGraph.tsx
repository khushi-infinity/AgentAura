"use client";

import { useEffect, useMemo, useState } from "react";
import { GLYPHS } from "./PixelSprite";

// Live Agent Network (spec §8 Home): nodes/edges derive from real backend
// task rows via GET /api/companies/:id/graph — and the graph is now actually
// alive: hover a node to see its live activity; click to pin an inspector.

interface GraphNode {
  id: string;
  label: string;
  role: string;
  type: string;
  status: string;
  avatar: string;
}
interface GraphEdge {
  from: string;
  to: string;
  kind: string;
  taskId?: string;
}
interface GraphTask {
  id: string;
  objective: string;
  status: string;
  assigneeAgentId: string | null;
  requesterAgentId: string | null;
  isOutsourced: boolean;
  externalProviderId: string | null;
  createdAt: Date;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  latestMission?: { id: string; objective: string; status: string } | null;
}

const ROLE_COLOR: Record<string, string> = {
  CEO: "#7c5cad",
  STRATEGY: "#2f6b7d",
  RESEARCH: "#007755",
  MARKETING: "#d9a441",
  PRODUCT: "#88ccff",
  VERIFICATION: "#015c44",
  EXTERNAL: "#b58430",
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "#0a8f6a",
  EXECUTING: "#0a8f6a",
  IDLE: "#9aa8ad",
  HIRED: "#b58430",
};

/** Draws an 8x8 pixel glyph inside the parent SVG at (x, y). */
function GlyphRects({
  name,
  x,
  y,
  scale,
  fill,
}: {
  name: string;
  x: number;
  y: number;
  scale: number;
  fill: string;
}) {
  const rows = GLYPHS[name] ?? GLYPHS.agents;
  return (
    <>
      {rows.map((row, yy) =>
        row.split("").map((c, xx) =>
          c === "#" ? (
            <rect
              key={`${xx}-${yy}`}
              x={x + xx * scale}
              y={y + yy * scale}
              width={scale}
              height={scale}
              fill={fill}
            />
          ) : null
        )
      )}
    </>
  );
}

interface Activity {
  objective: string;
  status: string;
  when: string;
}

function relTime(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function AgentGraph({ companyId }: { companyId: string }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [tasks, setTasks] = useState<GraphTask[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  // Poll the graph (cheap; SSE would be nicer later).
  useEffect(() => {
    if (!companyId) return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/graph`);
        const json = (await res.json()) as GraphData;
        if (!stop) {
          setData(json);
          setPulse((x) => x + 1);
        }
      } catch {
        /* noop */
      }
    };
    load();
    const t = setInterval(load, 4000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [companyId]);

  // Real per-agent activity rows.
  useEffect(() => {
    if (!companyId) return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/tasks?companyId=${companyId}`);
        const json = (await res.json()) as { tasks?: GraphTask[] };
        if (!stop) setTasks(json.tasks ?? []);
      } catch {
        /* noop */
      }
    };
    load();
    const t = setInterval(load, 6000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [companyId]);

  const activityByAgent = useMemo(() => {
    const m = new Map<string, Activity[]>();
    for (const t of tasks) {
      for (const key of [t.assigneeAgentId, t.requesterAgentId]) {
        if (!key) continue;
        const list = m.get(key) ?? [];
        list.push({
          objective: t.objective,
          status: t.status,
          when: relTime(new Date(t.createdAt).toISOString()),
        });
        m.set(key, list);
      }
    }
    for (const list of m.values()) list.sort((a, b) => 0); // already newest-first from API
    return m;
  }, [tasks]);

  const selected = pinned ?? hovered;

  const layout = useMemo(() => {
    if (!data) return null;
    const internal = data.nodes.filter((n) => n.type === "INTERNAL");
    const external = data.nodes.filter((n) => n.type === "EXTERNAL");
    const extCols = Math.max(1, Math.ceil(external.length / 5));
    const extRows = Math.ceil(external.length / extCols);
    const W = 640 + (extCols - 1) * 160;
    const H = Math.max(360, 120 + Math.max(internal.length, extRows) * 78);
    const cx = 300;
    const cy = H / 2;

    const pos = new Map<string, { x: number; y: number }>();
    internal.forEach((n) => {
      if (n.role === "CEO") {
        pos.set(n.id, { x: cx - 40, y: cy });
      } else {
        const others = internal.filter((x) => x.role !== "CEO").length;
        const idx = internal.filter((x) => x.role !== "CEO").findIndex((x) => x.id === n.id);
        const angle = (idx / Math.max(1, others)) * Math.PI * 2 - Math.PI / 2;
        pos.set(n.id, { x: cx - 40 + Math.cos(angle) * 150, y: cy + Math.sin(angle) * (H / 2 - 70) });
      }
    });
    external.forEach((n, i) => {
      const col = Math.floor(i / 5);
      const row = i % 5;
      pos.set(n.id, { x: cx + 240 + col * 160, y: cy + (row - (extRows - 1) / 2) * 78 });
    });
    return { W, H, pos, internalCount: internal.length, externalCount: external.length };
  }, [data]);

  if (!data || !layout || data.nodes.length === 0) {
    return (
      <div className="h-48 w-full rounded-xl border border-slate-100 bg-slate-50/60 grid place-items-center text-xs font-semibold text-slate-400">
        The network comes alive once your team starts working.
      </div>
    );
  }

  const nodeActivity = (id: string): Activity[] => activityByAgent.get(id) ?? [];
  const isSelected = (id: string) => selected === id;
  const dimNode = (id: string) => selected != null && !isSelected(id);
  const dimEdge = (e: GraphEdge) => selected != null && e.from !== selected && e.to !== selected;

  return (
    <div className="space-y-2" data-purpose="agent-graph">
      {/* Graph canvas — hover to peek, click to pin */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-100 bg-[#f6f1e4]"
        onMouseLeave={() => setHovered(null)}
      >
        <svg viewBox={`0 0 ${layout.W} ${layout.H}`} className="w-full" style={{ maxHeight: 380 }}>
          {/* Edges */}
          {data.edges.map((e, i) => {
            const a = layout.pos.get(e.from);
            const b = layout.pos.get(e.to);
            if (!a || !b) return null;
            const hired = e.kind === "hires";
            const active = selected != null && (e.from === selected || e.to === selected);
            return (
              <g key={`e${i}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={hired ? "#b58430" : "#0f7a5c"}
                  strokeWidth={active ? 3 : hired ? 2 : 1.4}
                  strokeDasharray={hired ? "6 3" : undefined}
                  opacity={dimEdge(e) ? 0.12 : active ? 0.95 : 0.45}
                  className={active && !hired ? "graph-flow" : undefined}
                />
                {hired && !dimEdge(e) ? (
                  <text
                    x={a.x + (b.x - a.x) * 0.6}
                    y={a.y + (b.y - a.y) * 0.6 - 8}
                    fontSize="9"
                    fontWeight="700"
                    fill="#b58430"
                    textAnchor="middle"
                  >
                    hire
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* Nodes */}
          {data.nodes.map((n) => {
            const p = layout.pos.get(n.id);
            if (!p) return null;
            const color = ROLE_COLOR[n.role] ?? "#5b6d74";
            const dim = dimNode(n.id);
            const sel = isSelected(n.id);
            const acts = nodeActivity(n.id);
            const live = ["ACTIVE", "EXECUTING"].includes(n.status);
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                opacity={dim ? 0.25 : 1}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(n.id)}
                onClick={() => setPinned(pinned === n.id ? null : n.id)}
              >
                <rect
                  x={-60}
                  y={-24}
                  width={120}
                  height={48}
                  rx={4}
                  fill={sel ? "#fffdf6" : "#faf2e2"}
                  stroke={sel ? color : "#0f2b33"}
                  strokeWidth={sel ? 3 : 2}
                />
                <rect x={-60} y={-24} width={6} height={48} fill={color} />
                <GlyphRects name={n.role} x={-50} y={-12} scale={2.5} fill={color} />
                <text x={-30} y={-4} fontSize="10" fontWeight="700" fill="#132029">
                  {n.label.length > 15 ? n.label.slice(0, 14) + "…" : n.label}
                </text>
                <text x={-30} y={8} fontSize="7.5" fill="#5b6d74">
                  {n.type === "EXTERNAL" ? "external ASP · hired" : n.role.toLowerCase()}
                </text>
                {/* live/worked indicator */}
                <circle cx={48} cy={-14} r={4} fill={STATUS_DOT[n.status] ?? "#9aa8ad"}>
                  {live ? <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite" /> : null}
                </circle>
                {acts.length > 0 ? (
                  <text x={-52} y={20} fontSize="7" fill="#8a7a55">
                    {acts.length} task{acts.length > 1 ? "s" : ""}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Hint / clear pin */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {pinned ? (
            <button
              onClick={() => setPinned(null)}
              className="text-[10px] font-bold px-2 py-1 rounded-md bg-white/90 border border-slate-200 text-slate-600 hover:bg-white shadow-sm"
            >
              Unpin ✕
            </button>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-white/80 border border-slate-200 text-slate-500">
              Hover a node · click to pin
            </span>
          )}
        </div>
      </div>

      {/* Inspector: live details for the selected node */}
      {selected && (
        <div
          className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm"
          data-purpose="graph-inspector"
        >
          {(() => {
            const n = data.nodes.find((x) => x.id === selected);
            if (!n) return null;
            const color = ROLE_COLOR[n.role] ?? "#5b6d74";
            const acts = nodeActivity(n.id);
            return (
              <>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-extrabold text-slate-900">{n.label}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {n.type === "EXTERNAL" ? "OKX AI marketplace hire" : n.role.toLowerCase()}
                  </span>
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ["ACTIVE", "EXECUTING"].includes(n.status)
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {n.status.charAt(0) + n.status.slice(1).toLowerCase()}
                  </span>
                </div>
                {acts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium">
                    No tasks yet — this agent picks up work when the CEO delegates.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {acts.slice(0, 3).map((a, i) => (
                      <li key={i} className="text-[11px] text-slate-600 font-medium flex items-baseline gap-2">
                        <span
                          className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ["COMPLETED", "DELIVERED", "VERIFIED", "PAID"].includes(a.status)
                              ? "bg-emerald-50 text-emerald-700"
                              : a.status === "EXECUTING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                        </span>
                        <span className="truncate">{a.objective}</span>
                        <span className="shrink-0 text-slate-400 text-[10px]">{a.when}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          })()}
        </div>
      )}

      <div className="flex items-center gap-4 px-1 text-[10px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-emerald-700 inline-block" /> delegates
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-0.5 inline-block"
            style={{ backgroundImage: "repeating-linear-gradient(90deg,#b58430 0 4px,transparent 4px 7px)" }}
          />
          external hire (OKX AI)
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse inline-block" />
          live from real task state
        </span>
      </div>
    </div>
  );
}
