import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, missions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../../bootstrap";

// GET /api/companies/:id (spec §15)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await bootstrap();
  const { id } = await ctx.params;
  const company = db.select().from(companies).where(eq(companies.id, id)).get();
  if (!company) return NextResponse.json({ error: "not found" }, { status: 404 });
  const missionRows = db.select().from(missions).where(eq(missions.companyId, id)).all();
  return NextResponse.json({ company, missions: missionRows });
}
