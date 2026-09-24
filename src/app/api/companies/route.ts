import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, missions, agents, tasks } from "@/lib/db/schema";
import { newId, emitEvent } from "@/lib/events/service";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";
import { rateLimit, clientKey, tooMany } from "@/lib/security";
import { z } from "zod";

// POST /api/companies (spec §15) — Create Company (spec §8)
const createSchema = z.object({
  name: z.string().max(80).optional(),
  description: z.string().max(300).optional(),
  primaryGoal: z.string().max(240).optional(),
  budgetUsd: z.number().min(1).max(1000).optional(),
  autonomyPolicy: z.enum(["ASK_BEFORE_HIRING", "AUTO_HIRE_BELOW_BUDGET", "FULLY_AUTONOMOUS"]).optional(),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKey(req, "companies"), 10)) return tooMany();
  await bootstrap();
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const body = parsed.data;

  const name = (body.name ?? "").trim() || "My Company";
  const goal = (body.primaryGoal ?? "").trim() || "Launch our product and get first 100 users";
  const policy = body.autonomyPolicy ?? "ASK_BEFORE_HIRING";
  const budget = Math.max(10, Math.round((body.budgetUsd ?? 10) * 100));

  const companyId = newId("co");
  db.insert(companies)
    .values({
      id: companyId,
      name,
      description: body.description ?? "",
      mission: goal,
      budgetCents: budget,
      autonomyPolicy: policy,
    })
    .run();

  // Founding agent team (spec §8 preview).
  const roster = [
    { role: "CEO", name: "CEO Agent", avatar: "CEO", desc: "Orchestration and decision making" },
    { role: "STRATEGY", name: "Strategy Agent", avatar: "STRATEGY", desc: "Planning and market positioning" },
    { role: "RESEARCH", name: "Research Agent", avatar: "RESEARCH", desc: "Market, users and competitors" },
    { role: "MARKETING", name: "Marketing Agent", avatar: "MARKETING", desc: "Content, growth and community" },
    { role: "VERIFICATION", name: "Verification Agent", avatar: "VERIFICATION", desc: "Quality check and validation" },
  ];
  for (const r of roster) {
    const agentId = newId("agent");
    db.insert(agents)
      .values({
        id: agentId,
        companyId,
        name: r.name,
        role: r.role,
        type: "INTERNAL",
        avatar: r.avatar,
        description: r.desc,
        capabilities: JSON.stringify([r.role.toLowerCase()]),
      })
      .run();
    if (r.role === "CEO") {
      emitEvent({
        companyId,
        type: "TASK_ASSIGNED",
        actorId: agentId,
        actorName: "CEO Agent",
        title: `Company "${name}" assembled — ${roster.length} agents ready`,
        detail: `Autonomy policy: ${policy.replaceAll("_", " ").toLowerCase()}`,
      });
    }
  }

  // Company treasury wallet.
  const { wallets } = await import("@/lib/db/schema");
  db.insert(wallets)
    .values({
      id: newId("wal"),
      companyId,
      label: "Company Treasury (Agentic Wallet)",
      address: "0xDemo" + Math.random().toString(16).slice(2, 6).toUpperCase() + "…",
      isDemo: true,
      totalCents: budget,
      availableCents: budget,
    })
    .run();

  const missionId = newId("mis");
  db.insert(missions)
    .values({ id: missionId, companyId, objective: goal, status: "DRAFT", priority: "HIGH" })
    .run();

  emitEvent({
    companyId,
    missionId,
    type: "TASK_CREATED",
    actorName: "Founder",
    title: `Company "${name}" created`,
    detail: `Mission drafted: ${goal}`,
  });

  return NextResponse.json({ companyId, missionId });
}

// PATCH /api/companies — update the workspace's editable fields (founder
// name). One company in the demo UX; no id needed.
const patchSchema = z.object({
  founderName: z.string().min(1).max(60),
});
export async function PATCH(req: NextRequest) {
  if (!rateLimit(clientKey(req, "companies"), 10)) return tooMany();
  await bootstrap();
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const row = db.select().from(companies).all().at(-1);
  if (!row) return NextResponse.json({ error: "no_company" }, { status: 404 });
  db.update(companies)
    .set({ founderName: parsed.data.founderName.trim() })
    .where(eq(companies.id, row.id))
    .run();
  return NextResponse.json({ ok: true, founderName: parsed.data.founderName.trim() });
}

// GET /api/companies — newest company + missions (single-company demo UX).
// Always revalidate server-side: a stale cached response showing company:null
// after the founder just created one would bounce them back to onboarding.
// Fresh workspace returns 200 with company:null (not 404) so client polls
// don't spam the console with expected not-found noise during onboarding.
export async function GET() {
  await bootstrap();
  const rows = db.select().from(companies).all();
  if (rows.length === 0) {
    return NextResponse.json(
      { company: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const newest = rows[rows.length - 1];
  const missionRows = db.select().from(missions).where(eq(missions.companyId, newest.id)).all();
  const agentRows = db.select().from(agents).where(eq(agents.companyId, newest.id)).all();
  // External "agents" are ASPs the company actually hired — derived from
  // outsourced task rows, not from a counter we'd have to remember to bump.
  const taskRows = db.select().from(tasks).where(eq(tasks.companyId, newest.id)).all();
  const hiredProviders = new Set(
    taskRows.filter((t) => t.isOutsourced && t.externalProviderId).map((t) => t.externalProviderId as string),
  );
  return NextResponse.json(
    {
      company: newest,
      missions: missionRows,
      agentCount: agentRows.filter((a) => a.type === "INTERNAL").length,
      externalCount: hiredProviders.size,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
