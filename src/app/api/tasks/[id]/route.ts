import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, taskEvents, deliverables, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../../bootstrap";

// GET /api/tasks/:id (spec §15) — full task lifecycle data
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  const events = db.select().from(taskEvents).where(eq(taskEvents.taskId, id)).all();
  const deliverable = db.select().from(deliverables).where(eq(deliverables.taskId, id)).get();
  const payment = db.select().from(payments).where(eq(payments.taskId, id)).get();
  return NextResponse.json({ task, events, deliverable, payment });
}

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
