import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";
import { clearIdempotency } from "@/lib/security";
import { bootstrap } from "../bootstrap";
import { rateLimit, clientKey, tooMany } from "@/lib/security";

// POST /api/reset — wipe the workspace back to a fresh install: every company,
// mission, payment, ledger row and event is deleted, so the app lands on the
// Welcome/onboarding screen (the true demo cold-start). Demo data stays
// available via POST /api/seed-demo (Settings → Workspace → "Load demo").
//
// The seed's own truncate list lives in src/lib/db/seed.ts; that module is
// server-only-bundled, so the table list is mirrored here (fail-safe: any
// table added later must appear in both).
const TABLES = [
  "task_events",
  "hire_requests",
  "deliverables",
  "payments",
  "transactions",
  "tasks",
  "missions",
  "memory_items",
  "agents",
  "external_providers",
  "wallets",
  "companies",
];

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req as never, "reset"), 10)) return tooMany();
  await bootstrap();

  // Aborts in-flight mission loops at their next step check (no orphan task
  // inserts), and unblocks re-creating a company's first mission immediately.
  clearIdempotency();

  sqlite.exec("PRAGMA foreign_keys = OFF");
  for (const t of TABLES) sqlite.exec(`DELETE FROM ${t}`);
  sqlite.exec("PRAGMA foreign_keys = ON");

  return NextResponse.json({ ok: true, reset: true });
}
