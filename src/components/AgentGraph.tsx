"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui";

// Living agent graph (spec §8 Home): nodes/edges derive from real backend
// task rows via GET /api/companies/:id/graph — not decorative.

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
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const ROLE_COLOR: Record<string, string> = {
  CEO: "#7c5cad",
  STRATEGY: "#3e8e83",
  RESEARCH: "#2e7d4f",
  MARKETING: "#d9a441",
  PRODUCT: "#7fb4c9",
  VERIFICATION: "#256741",
  EXTERNAL: "#b58430",
};

export function AgentGraph({ companyId }: { companyId: string }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [tick, setTick] = useState(0);

  // Re-poll so new hires appear; cheap and honest (could be SSE later).
  useEffect(() => {
    if (!companyId) return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/graph`);
        const json = (await res.json()) as GraphData;
        if (!stop) setData(json);
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
  }, [companyId, tick]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 4000);
    return () => clearInterval(t);
  }, []);

  if (!data || data.nodes.length === 0) {
    return (
      <Card className="p-6 text-sm text-ink-soft">
        The agent workspace comes alive once a company exists. Create one to assemble your team.
      </Card>
    );
  }

  // Layout: CEO center, internal agents in a ring, external ASPs in a
  // right-hand column (a ring clipped past the viewBox once).
  const W = 620;
  const H = 380;
  const cx = 300;
  const cy = 190;
  const internal = data.nodes.filter((n) => n.type === "INTERNAL");
  const external = data.nodes.filter((n) => n.type === "EXTERNAL");

  const pos = new Map<string, { x: number; y: number }>();
  internal.forEach((n, i) => {
    if (n.role === "CEO") {
      pos.set(n.id, { x: cx - 40, y: cy });
    } else {
      const others = internal.filter((x) => x.role !== "CEO").length;
      const idx = internal.filter((x) => x.role !== "CEO").findIndex((x) => x.id === n.id);
      const angle = (idx / Math.max(1, others)) * Math.PI * 2 - Math.PI / 2;
      pos.set(n.id, { x: cx - 40 + Math.cos(angle) * 130, y: cy + Math.sin(angle) * 100 });
    }
  });
  {
    const gapY = Math.min(150, (H - 150) / Math.max(1, external.length - 1 || 1));
    const startY = cy - ((external.length - 1) * gapY) / 2;
    external.forEach((n, i) => pos.set(n.id, { x: cx + 240, y: startY + i * gapY }));
  }

  return (
    <Card className="p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {data.edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const hired = e.kind === "hires";
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={hired ? "#b58430" : "#2e7d4f"}
                strokeWidth={hired ? 2.5 : 1.5}
                strokeDasharray={hired ? "6 3" : undefined}
                opacity={0.7}
              />
              {hired ? (
                <text
                  x={a.x + (b.x - a.x) * 0.62}
                  y={a.y + (b.y - a.y) * 0.62 - 10}
                  fontSize="9"
                  fill="#b58430"
                  textAnchor="middle"
                >
                  hire
                </text>
              ) : null}
            </g>
          );
        })}
        {data.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const color = ROLE_COLOR[n.role] ?? "#51625a";
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`}>
              <rect x={-58} y={-21} width={116} height={42} rx={3} fill="#f7f1e3" stroke="#143329" strokeWidth={2} />
              <rect x={-58} y={-21} width={6} height={42} fill={color} />
              <text x={-46} y={4} fontSize="14">
                {n.avatar}
              </text>
              <text x={-28} y={-2} fontSize="9.5" fontWeight="600" fill="#1d2b26">
                {n.label.length > 17 ? n.label.slice(0, 16) + "…" : n.label}
              </text>
              <text x={-28} y={10} fontSize="7.5" fill="#51625a">
                {n.type === "EXTERNAL" ? "external ASP · hired" : n.role.toLowerCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1 text-[10px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-leaf inline-block" /> delegates
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-gold-deep inline-block" style={{ backgroundImage: "repeating-linear-gradient(90deg,#b58430 0 4px,transparent 4px 7px)" }} /> external hire
        </span>
        <span className="ml-auto">derived from real task state</span>
      </div>
    </Card>
  );
}
