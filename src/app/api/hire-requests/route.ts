import { NextRequest, NextResponse } from "next/server";
import { pendingHires, decideHire } from "@/lib/engine/orchestrator";
import { bootstrap } from "../bootstrap";

// GET /api/hire-requests?companyId=… — pending approvals
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
  return NextResponse.json({ pending: pendingHires(companyId) });
}

// POST /api/hire-requests { hireId, approved }
export async function POST(req: NextRequest) {
  await bootstrap();
  const body = (await req.json()) as { hireId: string; approved: boolean };
  const ok = await decideHire(body.hireId, Boolean(body.approved));
  return NextResponse.json({ ok });
}
