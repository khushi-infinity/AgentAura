import { NextRequest, NextResponse } from "next/server";
import { pendingHires, decideHire } from "@/lib/engine/orchestrator";
import { db } from "@/lib/db";
import { wallets, hireRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  // Business-realistic guard: an approval without treasury cover cannot
  // settle. Declining returns the engine to its internal fallback (the
  // same path as an expired approval), so the mission still completes.
  if (parsed.data.approved) {
    const hire = db.select().from(hireRequests).where(eq(hireRequests.id, parsed.data.hireId)).get();
    if (hire) {
      const w = db.select().from(wallets).where(eq(wallets.companyId, hire.companyId)).get();
      if (!w || w.availableCents < hire.priceCents) {
        return NextResponse.json(
          {
            error: "insufficient_funds",
            neededCents: hire.priceCents,
            availableCents: w?.availableCents ?? 0,
            hint: "Deposit funds on the Wallet page, or decline to let the engine use internal capability.",
          },
          { status: 409 },
        );
      }
    }
  }

  const ok = await decideHire(parsed.data.hireId, parsed.data.approved);
  return NextResponse.json({ ok });
}
