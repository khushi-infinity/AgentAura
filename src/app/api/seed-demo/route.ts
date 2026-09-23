import { NextResponse } from "next/server";
import { bootstrap } from "../bootstrap";

// POST /api/seed-demo — opt-in demo workspace (Settings → Workspace).
// Uses the same seed as `npm run db:seed`; wipes existing rows first, which is
// the intended behavior for a "reset to demo data" control.
export async function POST() {
  await bootstrap();
  const { seed } = await import("@/lib/db/seed");
  seed();
  return NextResponse.json({ ok: true, seeded: "demo" });
}
