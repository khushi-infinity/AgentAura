import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missions, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runMission } from "@/lib/engine/orchestrator";
import { bootstrap } from "../../../../bootstrap";

// POST /api/companies/:id/goals/execute (spec §15) — kicks off the CEO
// orchestration loop in the background; the UI follows via SSE.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { missionId?: string; objective?: string };

  const company = db.select().from(missions).where(eq(missions.companyId, id)).get();
  let missionId = body.missionId;

  if (!missionId) {
    const mid = "mis_" + Math.random().toString(36).slice(2, 10);
    db.insert(missions)
      .values({
        id: mid,
        companyId: id,
        objective: body.objective ?? "Launch our product and get first 100 users",
        status: "ACTIVE",
        priority: "HIGH",
      })
      .run();
    missionId = mid;
  } else {
    db.update(missions).set({ status: "ACTIVE" }).where(eq(missions.id, missionId)).run();
  }

  const hasAgents = db.select().from(agents).where(eq(agents.companyId, id)).all().length > 0;
  if (!hasAgents && !company) {
    return NextResponse.json({ error: "company not found" }, { status: 404 });
  }

  // Fire-and-forget: the SSE stream carries progress.
  void runMission(missionId).catch((err) => {
    console.error("[engine] mission run failed:", err);
  });

  return NextResponse.json({ missionId });
}
