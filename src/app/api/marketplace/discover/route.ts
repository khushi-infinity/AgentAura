import { NextRequest, NextResponse } from "next/server";
import { getDiscoveryAdapter } from "@/lib/okx";
import { isDemoMode } from "@/lib/okx/config";
import { bootstrap } from "../../bootstrap";

// POST /api/marketplace/discover (spec §15) — goes through the real adapter
// interface so DEMO_MODE and live mode share one code path.
export async function POST(req: NextRequest) {
  await bootstrap();
  const body = (await req.json()) as { keywords?: string[]; maxPriceCents?: number; intent?: string };
  const offers = await getDiscoveryAdapter().discover({
    intent: body.intent ?? "general assistance",
    keywords: body.keywords ?? [],
    maxPriceCents: body.maxPriceCents,
  });
  return NextResponse.json({ offers, demoMode: isDemoMode() });
}
