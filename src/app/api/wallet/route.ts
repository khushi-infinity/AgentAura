import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wallets, transactions, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { bootstrap } from "../bootstrap";

// GET /api/wallet (spec §15)
export async function GET(req: NextRequest) {
  await bootstrap();
  const companyId = req.nextUrl.searchParams.get("companyId");
  const wallet = companyId
    ? db.select().from(wallets).where(eq(wallets.companyId, companyId)).get()
    : db.select().from(wallets).get();
  const txs = companyId
    ? db.select().from(transactions).where(eq(transactions.companyId, companyId)).all()
    : db.select().from(transactions).all();
  const pays = companyId
    ? db.select().from(payments).where(eq(payments.companyId, companyId)).all()
    : db.select().from(payments).all();
  txs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return NextResponse.json({ wallet, transactions: txs, payments: pays });
}
