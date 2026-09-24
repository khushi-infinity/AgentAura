import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { bootstrap } from "../bootstrap";

// GET /api/protocol — network-level economics of the AgentAura protocol:
// gross settlement volume (GMV), the 5% protocol fee revenue, and the
// live-onchain vs simulated split. This is the business-model surface: the
// same fee line an investor sees in the pitch, derived from real payment
// rows — every settled agent-to-agent payment carries the take-rate.
const FEE_BPS = 500; // must match PLATFORM_FEE_BPS in the engine

export async function GET() {
  await bootstrap();
  const rows = db.select().from(payments).all();
  const settled = rows.filter((p) => p.status === "SETTLED");

  const gmvCents = settled.reduce((s, p) => s + p.amountCents, 0);
  // Fees recorded per payment row; for rows settled before fee columns
  // existed, compute from the rate so the line item never under-reports.
  const feeCents = settled.reduce((s, p) => {
    const recorded = p.feeCents ?? 0;
    return s + (recorded > 0 ? recorded : Math.round((p.amountCents * FEE_BPS) / 10000));
  }, 0);
  const liveSettled = settled.filter((p) => !p.isDemo);
  const liveGmvCents = liveSettled.reduce((s, p) => s + p.amountCents, 0);

  return NextResponse.json({
    gmvCents,
    feeCents,
    settlementCount: settled.length,
    failedCount: rows.filter((p) => p.status === "FAILED").length,
    liveSettlements: liveSettled.length,
    liveGmvCents,
    simulatedGmvCents: gmvCents - liveGmvCents,
    feeBps: FEE_BPS,
    averageTicketCents: settled.length ? Math.round(gmvCents / settled.length) : 0,
  });
}
