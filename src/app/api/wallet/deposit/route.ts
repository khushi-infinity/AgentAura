import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { wallets, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "@/lib/events/service";
import { bootstrap } from "../../bootstrap";

const Body = z.object({
  amountCents: z.number().int().min(1).max(10_000_00),
});

// POST /api/wallet/deposit — treasury top-up for the demo workspace.
// In demo mode this credits the wallet and writes an honestly-labeled
// transaction row (isDemo: true, no fake txHash). A live funding flow would
// go through `onchainos wallet` + the X Layer faucet instead.
export async function POST(req: NextRequest) {
  await bootstrap();
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const wallet = db.select().from(wallets).get();
  if (!wallet) return NextResponse.json({ error: "no_wallet" }, { status: 404 });

  const amount = parsed.data.amountCents;
  db.update(wallets)
    .set({
      totalCents: wallet.totalCents + amount,
      availableCents: wallet.availableCents + amount,
    })
    .where(eq(wallets.id, wallet.id))
    .run();

  const txId = newId("tx");
  db.insert(transactions)
    .values({
      id: txId,
      companyId: wallet.companyId,
      direction: "IN",
      kind: "DEPOSIT",
      counterparty: "Founder",
      memo: `Treasury deposit ${(amount / 100).toFixed(2)} USD₮0`,
      amountCents: amount,
      txHash: null,
      isDemo: true,
    })
    .run();

  return NextResponse.json({ ok: true, txId, balanceCents: wallet.totalCents + amount });
}
