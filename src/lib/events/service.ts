import "server-only";
import { db } from "@/lib/db";
import { taskEvents, missions, tasks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { publish } from "./bus";
import type { TaskEventType } from "@/lib/db/schema";
import type { LiveEvent } from "./bus";

// Event service (spec §20): every engine action becomes a persisted
// TaskEvent AND a live SSE event. Graph, Live Activity, Task Execution
// and Wallet screens all derive from these.

interface EmitInput {
  companyId: string;
  taskId?: string | null;
  missionId?: string | null;
  type: TaskEventType | string;
  actorId?: string | null;
  actorName?: string | null;
  title: string;
  detail?: string | null;
  payload?: Record<string, unknown>;
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function emitEvent(input: EmitInput): LiveEvent {
  const id = rid("evt");
  const now = new Date();
  const row = {
    id,
    companyId: input.companyId,
    taskId: input.taskId ?? null,
    missionId: input.missionId ?? null,
    type: input.type,
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    title: input.title,
    detail: input.detail ?? null,
    payload: JSON.stringify(input.payload ?? {}),
    createdAt: now,
  };
  db.insert(taskEvents).values(row).run();

  const live: LiveEvent = {
    id,
    companyId: row.companyId,
    taskId: row.taskId,
    missionId: row.missionId,
    type: row.type,
    actorId: row.actorId,
    actorName: row.actorName,
    title: row.title,
    detail: row.detail,
    payload: input.payload ?? {},
    createdAt: now.toISOString(),
  };
  publish(live);
  return live;
}

/** Recompute mission progress from task completion state. */
export function refreshMissionProgress(missionId: string) {
  const list = db.select().from(tasks).where(eq(tasks.missionId, missionId)).all();
  const total = list.length;
  const completed = list.filter((t) => t.status === "COMPLETED" || t.status === "PAID").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const spend = list.reduce((sum, t) => sum + t.spendCents, 0);
  db.update(missions)
    .set({ totalTasks: total, completedTasks: completed, progress, spendCents: spend })
    .where(eq(missions.id, missionId))
    .run();

  const m = db.select().from(missions).where(eq(missions.id, missionId)).get();
  if (total > 0 && completed === total) {
    if (m && m.status === "ACTIVE") {
      db.update(missions)
        .set({ status: "COMPLETED", completedAt: new Date() })
        .where(eq(missions.id, missionId))
        .run();
      emitEvent({
        companyId: m.companyId,
        missionId,
        type: "MISSION_COMPLETED",
        actorId: null,
        actorName: "CEO Agent",
        title: `Mission complete: ${m.objective}`,
        detail: `${completed}/${total} tasks completed · ${(spend / 100).toFixed(2)} USD₮0 spent`,
      });
    }
  } else if (m && m.status === "COMPLETED") {
    // Lazy step tasks (created mid-mission) reopen a falsely-final mission —
    // the count must stay honest for anyone reading the dashboards.
    db.update(missions).set({ status: "ACTIVE", completedAt: null }).where(eq(missions.id, missionId)).run();
  }
  return { total, completed, progress, spend };
}

export function newId(prefix: string): string {
  return rid(prefix);
}

export const _unusedSqlGuard = sql;
