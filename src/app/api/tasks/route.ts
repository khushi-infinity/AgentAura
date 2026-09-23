import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";

// GET /api/tasks?companyId=… — flat task list used by dashboard widgets.
// Missing companyId returns all tasks (single-company demo UX).
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  const rows = companyId
    ? db.select().from(tasks).where(eq(tasks.companyId, companyId)).all()
    : db.select().from(tasks).all();
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return NextResponse.json({ tasks: rows });
}
