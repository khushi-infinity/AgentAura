import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { directHire } from "@/lib/engine/orchestrator";
import { getDiscoveryAdapter } from "@/lib/okx";
import { bootstrap } from "../../bootstrap";

const Body = z.object({
  providerId: z.string().min(2).max(64),
  objective: z.string().min(8).max(400),
  companyId: z.string().min(4).max(64).optional(),
});

// POST /api/marketplace/hire — the Marketplace "Hire" button. The founder
// picks the provider up front, so this resolves the offer through the SAME
// discovery adapter the catalog used (no fabricated quotes), then runs the
// real engine path: task → OKX publish/deliver → Verification Agent →
// settlement. Approval is implicit (human-in-the-loop happened in the UI).
export async function POST(req: NextRequest) {
  await bootstrap();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { providerId, objective, companyId } = parsed.data;

  // Resolve the company (single-company workspace unless explicitly given).
  const { db } = await import("@/lib/db");
  const { companies } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const company = companyId
    ? db.select().from(companies).where(eq(companies.id, companyId)).get()
    : db.select().from(companies).get();
  if (!company) {
    return NextResponse.json(
      { error: "no_company", message: "Create your company first (complete onboarding)." },
      { status: 404 },
    );
  }

  // Re-discover so the provider offer (price, reasons, capabilities) comes
  // from the adapter, not from client-sent data — same catalog, same quotes.
  const offers = await getDiscoveryAdapter().discover({
    intent: objective,
    keywords: objective.split(/\s+/).slice(0, 8),
  });
  const provider = offers.find((o) => o.providerId === providerId);
  if (!provider) {
    return NextResponse.json(
      { error: "provider_unavailable", message: "That provider is no longer listed — refresh the catalog." },
      { status: 404 },
    );
  }

  try {
    const result = await directHire({ companyId: company.id, provider, objective });
    return NextResponse.json({
      ok: true,
      taskId: result.taskId,
      missionId: result.missionId,
      hireId: result.hireId,
      providerName: provider.providerName,
      priceCents: provider.priceCents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "hire_failed", message: (err as Error)?.message ?? "hire failed" },
      { status: 500 },
    );
  }
}

// No build-time execution: this route touches SQLite at request time only.
export const dynamic = "force-dynamic";
