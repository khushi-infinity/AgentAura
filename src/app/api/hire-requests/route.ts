import { NextRequest, NextResponse } from "next/server";
import { pendingHires, decideHire } from "@/lib/engine/orchestrator";
import { bootstrap } from "../bootstrap";
import { rateLimit, clientKey, tooMany } from "@/lib/security";
import { z } from "zod";

// GET /api/hire-requests?companyId=… — pending approvals
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
  return NextResponse.json({ pending: pendingHires(companyId) });
}

// POST /api/hire-requests { hireId, approved }
export async function POST(req: NextRequest) {
  if (!rateLimit(clientKey(req, "hire"), 30)) return tooMany();
  await bootstrap();
  const parsed = z
    .object({ hireId: z.string().min(4).max(64), approved: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const ok = await decideHire(parsed.data.hireId, parsed.data.approved);
  return NextResponse.json({ ok });
}
