import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, missions, agents } from "@/lib/db/schema";
import { newId, emitEvent } from "@/lib/events/service";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";

// POST /api/companies (spec §15) — Create Company (spec §8)
export async function POST(req: NextRequest) {
  await bootstrap();
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    primaryGoal?: string;
    budgetUsd?: number;
    autonomyPolicy?: string;
  };

  const name = (body.name ?? "").trim() || "My Company";
  const goal = (body.primaryGoal ?? "").trim() || "Launch our product and get first 100 users";
  const policy = ["ASK_BEFORE_HIRING", "AUTO_HIRE_BELOW_BUDGET", "FULLY_AUTONOMOUS"].includes(
    body.autonomyPolicy ?? ""
  )
    ? body.autonomyPolicy!
    : "ASK_BEFORE_HIRING";
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
    { role: "CEO", name: "CEO Agent", avatar: "👑", desc: "Orchestration and decision making" },
    { role: "STRATEGY", name: "Strategy Agent", avatar: "🧭", desc: "Planning and market positioning" },
    { role: "RESEARCH", name: "Research Agent", avatar: "🔬", desc: "Market, users and competitors" },
    { role: "MARKETING", name: "Marketing Agent", avatar: "📣", desc: "Content, growth and community" },
    { role: "VERIFICATION", name: "Verification Agent", avatar: "🛡️", desc: "Quality check and validation" },
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

  return NextResponse.json({ companyId, missionId });
}

// GET /api/companies — newest company + missions (single-company demo UX)
export async function GET() {
  await bootstrap();
  const rows = db.select().from(companies).all();
  if (rows.length === 0) return NextResponse.json({}, { status: 404 });
  const newest = rows[rows.length - 1];
  const missionRows = db.select().from(missions).where(eq(missions.companyId, newest.id)).all();
  const agentRows = db.select().from(agents).where(eq(agents.companyId, newest.id)).all();
  return NextResponse.json({
    company: newest,
    missions: missionRows,
    agentCount: agentRows.filter((a) => a.type === "INTERNAL").length,
    externalCount: agentRows.filter((a) => a.type === "EXTERNAL").length,
  });
}
