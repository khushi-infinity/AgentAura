import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, tasks, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";

// GET /api/agents (spec §15) — internal roster + real external providers.
// External "agents" are ASPs the company actually hired: derived from
// outsourced task rows; display names come from real payment rows.
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  const internalRows = companyId
    ? db.select().from(agents).where(eq(agents.companyId, companyId)).all()
    : db.select().from(agents).all();

  const companyIds = new Set(internalRows.map((a) => a.companyId));
  if (companyId) companyIds.add(companyId);

  // Outsourced task rows → hired providers (with per-provider task stats).
  type Ext = {
    id: string;
    name: string;
    role: string;
    type: "EXTERNAL";
    avatar: string;
    description: string;
    status: string;
    taskCount: number;
    successRate: number;
    externalProviderId: string | null;
  };
  const externals = new Map<string, Ext>();
  for (const cid of companyIds) {
    const taskRows = db.select().from(tasks).where(eq(tasks.companyId, cid)).all();
    const paidNames = new Map<string, string>();
    for (const p of db.select().from(payments).where(eq(payments.companyId, cid)).all()) {
      if (p.providerId && p.providerName) paidNames.set(p.providerId, p.providerName);
    }
    for (const t of taskRows) {
      if (!t.isOutsourced || !t.externalProviderId) continue;
      const pid = t.externalProviderId;
      const existing = externals.get(pid);
      const done = ["VERIFIED", "PAID", "COMPLETED"].includes(t.status);
      if (existing) {
        existing.taskCount += 1;
        if (done) existing.successRate = Math.round(((existing.successRate * (existing.taskCount - 1)) + 100) / existing.taskCount);
        existing.status = done ? "HIRED" : "WORKING";
      } else {
        const name = paidNames.get(pid) ?? pid.replace(/^prov_/, "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        externals.set(pid, {
          id: `ext_${pid}`,
          name,
          role: "EXTERNAL",
          type: "EXTERNAL",
          avatar: "EXTERNAL",
          description: "External specialist hired through the OKX.AI marketplace",
          status: done ? "HIRED" : "WORKING",
          taskCount: 1,
          successRate: done ? 100 : 0,
          externalProviderId: pid,
        });
      }
    }
  }

  return NextResponse.json({ agents: internalRows, externalProviders: [...externals.values()] });
}
