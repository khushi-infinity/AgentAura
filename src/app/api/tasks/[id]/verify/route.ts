import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, deliverables } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { emitEvent } from "@/lib/events/service";
import { bootstrap } from "../../../bootstrap";

// POST /api/tasks/:id/verify (spec §15) — manual verification trigger
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  const del = db.select().from(deliverables).where(eq(deliverables.taskId, id)).get();
  if (!del) return NextResponse.json({ error: "no deliverable" }, { status: 400 });

  db.update(deliverables)
    .set({ verificationStatus: "VERIFIED", verificationScore: Math.max(del.verificationScore, 80) })
    .where(eq(deliverables.id, del.id))
    .run();
  emitEvent({
    companyId: task.companyId,
    taskId: id,
    missionId: task.missionId,
    type: "VERIFICATION_PASSED",
    actorName: "Verification Agent",
    title: "Manual verification passed",
    detail: "User-triggered verification completed",
  });
  return NextResponse.json({ ok: true });
}
