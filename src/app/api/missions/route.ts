import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { missions, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";

// GET /api/missions + POST /api/missions (spec §15)
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  const rows = companyId
    ? db.select().from(missions).where(eq(missions.companyId, companyId)).all()
    : db.select().from(missions).all();
  return NextResponse.json({ missions: rows });
}

export async function POST(req: NextRequest) {
  await bootstrap();
  const body = (await req.json()) as { companyId: string; objective: string; priority?: string };
  const id = "mis_" + Math.random().toString(36).slice(2, 10);
  db.insert(missions)
    .values({
      id,
      companyId: body.companyId,
      objective: body.objective,
      status: "DRAFT",
      priority: body.priority ?? "MEDIUM",
    })
    .run();
  return NextResponse.json({ missionId: id });
}

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
