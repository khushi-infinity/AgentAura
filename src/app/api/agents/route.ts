import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";

// GET /api/agents (spec §15)
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  const rows = companyId
    ? db.select().from(agents).where(eq(agents.companyId, companyId)).all()
    : db.select().from(agents).all();
  return NextResponse.json({ agents: rows });
}
