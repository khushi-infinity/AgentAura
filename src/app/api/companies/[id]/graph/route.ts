import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, tasks, missions, payments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { bootstrap } from "../../../bootstrap";

// GET /api/companies/:id/graph (spec §15) — Home graph reflects actual
// backend state: nodes = agents (+ external provider nodes), edges from
// real task delegation/outsourcing rows.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const companyAgents = db.select().from(agents).where(eq(agents.companyId, id)).all();
  const recentTasks = db.select().from(tasks).where(eq(tasks.companyId, id)).orderBy(desc(tasks.createdAt)).limit(50).all();

  type Node = { id: string; label: string; role: string; type: string; status: string; avatar: string };
  const nodes: Node[] = companyAgents.map((a) => ({
    id: a.id,
    label: a.name,
    role: a.role,
    type: a.type,
    status: a.status,
    avatar: a.avatar,
  }));

  // External provider nodes for outsourced tasks. Names come from real
  // settlement rows; the raw provider id is only a last-resort fallback.
  const paidNames = new Map<string, string>();
  for (const p of db.select().from(payments).where(eq(payments.companyId, id)).all()) {
    if (p.providerId && p.providerName) paidNames.set(p.providerId, p.providerName);
  }

  const extSeen = new Map<string, { id: string; name: string }>();
  for (const t of recentTasks) {
    if (t.isOutsourced && t.externalProviderId && !extSeen.has(t.externalProviderId)) {
      const name =
        paidNames.get(t.externalProviderId) ??
        t.externalProviderId.replace(/^prov_/, "").replace(/[-_]/g, " ");
      extSeen.set(t.externalProviderId, { id: t.externalProviderId, name });
    }
  }
  for (const [pid, p] of extSeen) {
    nodes.push({ id: pid, label: p.name, role: "EXTERNAL", type: "EXTERNAL", status: "IDLE", avatar: "EXTERNAL" });
  }

  type Edge = { from: string; to: string; kind: string; taskId?: string };
  const edges: Edge[] = [];
  const ceo = companyAgents.find((a) => a.role === "CEO");
  for (const t of recentTasks) {
    if (t.requesterAgentId && t.assigneeAgentId && t.requesterAgentId !== t.assigneeAgentId) {
      edges.push({ from: t.requesterAgentId, to: t.assigneeAgentId, kind: "delegates", taskId: t.id });
    } else if (ceo && t.assigneeAgentId) {
      edges.push({ from: ceo.id, to: t.assigneeAgentId, kind: "delegates", taskId: t.id });
    }
    if (t.isOutsourced && t.externalProviderId && t.assigneeAgentId) {
      edges.push({ from: t.assigneeAgentId, to: t.externalProviderId, kind: "hires", taskId: t.id });
    }
  }

  const latest = await db.select().from(missions).where(eq(missions.companyId, id)).orderBy(desc(missions.createdAt)).get();
  return NextResponse.json({ nodes, edges, latestMission: latest ?? null });
}

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
