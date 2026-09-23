import "server-only";
import { migrate } from "@/lib/db/migrate";

let ready: Promise<void> | null = null;

// Bootstrap only ensures the schema exists. It deliberately does NOT seed a
// demo company: a fresh install must land on /onboarding (spec §1 Welcome),
// not on somebody else's sample data. Demo data is opt-in via
// POST /api/seed-demo (Settings → Workspace → "Load demo workspace").
async function doBootstrap() {
  migrate();
}

export function bootstrap(): Promise<void> {
  ready ??= doBootstrap();
  return ready;
}
