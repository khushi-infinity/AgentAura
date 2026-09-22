import "server-only";
import { migrate } from "@/lib/db/migrate";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";

let ready: Promise<void> | null = null;

async function doBootstrap() {
  migrate();
  const rows = db.select().from(companies).limit(1).all();
  if (rows.length === 0) {
    const { seed } = await import("@/lib/db/seed");
    seed();
  }
}

export function bootstrap(): Promise<void> {
  ready ??= doBootstrap();
  return ready;
}
