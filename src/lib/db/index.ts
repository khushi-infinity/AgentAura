import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, "agentaura.db"));
sqlite.pragma("journal_mode = WAL");
// Never fail fast on a concurrent writer (build-time page-data collection
// and mission loops can briefly overlap); wait up to 5s instead of throwing
// "database is locked".
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export { sqlite, schema };
