import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/okx/config";
import { bootstrap } from "../bootstrap";

// GET /api/config — public runtime flags the UI labels itself with
// (demo vs live OKX AI rail). No secrets.
export async function GET() {
  await bootstrap();
  return NextResponse.json({
    demoMode: isDemoMode(),
    network: process.env.ONCHAINOS_NETWORK ?? "xlayer-testnet",
  });
}
