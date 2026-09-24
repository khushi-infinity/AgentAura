import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memoryItems } from "@/lib/db/schema";
import { bootstrap } from "../bootstrap";

// GET /api/memory (spec §15)
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  const q = req.nextUrl.searchParams.get("q");
  let rows = db.select().from(memoryItems).all();
  if (companyId) rows = rows.filter((r) => r.companyId === companyId);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) => r.title.toLowerCase().includes(needle) || r.content.toLowerCase().includes(needle)
    );
  }
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return NextResponse.json({ items: rows });
}

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
