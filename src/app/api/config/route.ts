import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/okx/config";
import { llmStatus } from "@/lib/llm/provider";
import { bootstrap } from "../bootstrap";

// GET /api/config — client-safe operational flags (no secrets).
export async function GET() {
  await bootstrap();
  return NextResponse.json({
    demoMode: isDemoMode(),
    llmConfigured: llmStatus().configured,
    llmModel: llmStatus().model,
    network: "xlayer-testnet",
  });
}
