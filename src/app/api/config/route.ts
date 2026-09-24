import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/okx/config";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { bootstrap } from "../bootstrap";

// GET /api/config — public runtime flags the UI labels itself with
// (demo vs live OKX AI rail, founder display name). No secrets.
export async function GET() {
  await bootstrap();
  const row = db.select({ founderName: companies.founderName }).from(companies).all().at(-1);
  return NextResponse.json({
    demoMode: isDemoMode(),
    network: process.env.ONCHAINOS_NETWORK ?? "xlayer-testnet",
    founderName: row?.founderName ?? "Jane Doe",
    llmConfigured: Boolean(process.env.OPENAI_API_KEY),
    llmModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  });
}
