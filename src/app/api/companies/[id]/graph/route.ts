import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, tasks, missions } from "@/lib/db/schema";
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

  // External provider nodes for outsourced tasks.
  const extSeen = new Map<string, { id: string; name: string }>();
  for (const t of recentTasks) {
    if (t.isOutsourced && t.externalProviderId && !extSeen.has(t.externalProviderId)) {
      extSeen.set(t.externalProviderId, { id: t.externalProviderId, name: t.externalProviderId });
    }
  }
  for (const [pid, p] of extSeen) {
    nodes.push({ id: pid, label: p.name.replace("prov_", "ASP: "), role: "EXTERNAL", type: "EXTERNAL", status: "IDLE", avatar: "🌐" });
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
