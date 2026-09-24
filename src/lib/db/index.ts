import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

// Pragma order matters: busy_timeout MUST be set before journal_mode.
// Next's build-time page-data collection opens this module in parallel
// workers; with WAL first, concurrent opens raced before any wait was
// configured and threw "SQLITE_BUSY: database is locked" (flaky deploys).
const sqlite = new Database(path.join(dataDir, "agentaura.db"));
sqlite.pragma("busy_timeout = 10000");
for (let attempt = 0; ; attempt++) {
  try {
    sqlite.pragma("journal_mode = WAL");
    break;
  } catch (err) {
    if (attempt >= 10 || (err as { code?: string }).code !== "SQLITE_BUSY") throw err;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * (attempt + 1));
  }
}

export const db = drizzle(sqlite, { schema });
export { sqlite, schema };
