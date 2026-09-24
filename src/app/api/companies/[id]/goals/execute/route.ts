import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missions, agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { runMission } from "@/lib/engine/orchestrator";
import { bootstrap } from "../../../../bootstrap";
import { rateLimit, clientKey, tooMany, checkAndSetIdempotency } from "@/lib/security";
import { z } from "zod";

// POST /api/companies/:id/goals/execute (spec §15) — kicks off the CEO
// orchestration loop in the background; the UI follows via SSE.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!rateLimit(clientKey(req, "execute"), 10)) return tooMany();
  await bootstrap();
  const { id } = await ctx.params;
  const parsed = z
    .object({ missionId: z.string().max(64).optional(), objective: z.string().max(240).optional() })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const body = parsed.data;

  // Idempotency (spec §19): a double-click must not double-run the loop.
  if (!checkAndSetIdempotency(`execute:${id}:${body.missionId ?? "new"}`)) {
    return NextResponse.json({ error: "duplicate_request" }, { status: 409 });
  }

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

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
