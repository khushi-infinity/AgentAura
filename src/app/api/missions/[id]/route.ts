import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missions, tasks, deliverables } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../../bootstrap";

// GET /api/missions/:id (spec §15) — mission detail incl. tasks + deliverables
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const mission = db.select().from(missions).where(eq(missions.id, id)).get();
  if (!mission) return NextResponse.json({ error: "not found" }, { status: 404 });
  const taskRows = db.select().from(tasks).where(eq(tasks.missionId, id)).all();
  const dels = db.select().from(deliverables).all().filter((d) => taskRows.some((t) => t.id === d.taskId));
  return NextResponse.json({ mission, tasks: taskRows, deliverables: dels });
}
