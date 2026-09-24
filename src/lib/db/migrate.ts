import { sqlite } from "./index";

// Idempotent DDL. For the hackathon, CREATE TABLE IF NOT EXISTS driven by
// hand-written SQL matching src/lib/db/schema.ts. Re-running is safe.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    founder_name TEXT NOT NULL DEFAULT 'Jane Doe',
    mission TEXT,
    budget_cents INTEGER NOT NULL DEFAULT 1000,
    autonomy_policy TEXT NOT NULL DEFAULT 'ASK_BEFORE_HIRING',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INTERNAL',
    avatar TEXT NOT NULL DEFAULT 'agents',
    description TEXT NOT NULL DEFAULT '',
    capabilities TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'IDLE',
    task_count INTEGER NOT NULL DEFAULT 0,
    success_rate INTEGER NOT NULL DEFAULT 100,
    external_provider_id TEXT,
    external_service_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    priority TEXT NOT NULL DEFAULT 'HIGH',
    progress INTEGER NOT NULL DEFAULT 0,
    total_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    spend_cents INTEGER NOT NULL DEFAULT 0,
    summary TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    parent_task_id TEXT,
    requester_agent_id TEXT,
    assignee_agent_id TEXT,
    role TEXT NOT NULL DEFAULT 'RESEARCH',
    objective TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PLANNED',
    budget_cents INTEGER NOT NULL DEFAULT 0,
    spend_cents INTEGER NOT NULL DEFAULT 0,
    is_outsourced INTEGER NOT NULL DEFAULT 0,
    external_provider_id TEXT,
    external_task_ref TEXT,
    capability_gap TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS task_events (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    task_id TEXT,
    mission_id TEXT,
    type TEXT NOT NULL,
    actor_id TEXT,
    actor_name TEXT,
    title TEXT NOT NULL,
    detail TEXT,
    payload TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS deliverables (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    content TEXT NOT NULL,
    artifact_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    verification_score INTEGER NOT NULL DEFAULT 0,
    verifier_agent_id TEXT,
    verification_notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS external_providers (
    id TEXT PRIMARY KEY,
    provider_name TEXT NOT NULL,
    service_id TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'A2A',
    category TEXT NOT NULL DEFAULT 'Research',
    tagline TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL DEFAULT 50,
    price_unit TEXT NOT NULL DEFAULT 'task',
    reputation INTEGER NOT NULL DEFAULT 46,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    success_rate INTEGER NOT NULL DEFAULT 95,
    capabilities TEXT NOT NULL DEFAULT '[]',
    is_demo INTEGER NOT NULL DEFAULT 1,
    metadata TEXT NOT NULL DEFAULT '{}'
  )`,
  `CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INSIGHT',
    folder TEXT NOT NULL DEFAULT 'research',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_agent_id TEXT,
    source_agent_name TEXT,
    source_task_id TEXT,
    external_provider_id TEXT,
    confidence INTEGER NOT NULL DEFAULT 80,
    verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    task_id TEXT,
    mission_id TEXT,
    provider_name TEXT NOT NULL,
    provider_id TEXT,
    amount_cents INTEGER NOT NULL,
    fee_cents INTEGER NOT NULL DEFAULT 0,
    net_amount_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USDT0',
    network TEXT NOT NULL DEFAULT 'xlayer-testnet',
    status TEXT NOT NULL DEFAULT 'PENDING',
    method TEXT NOT NULL DEFAULT 'x402-exact',
    escrowed INTEGER NOT NULL DEFAULT 0,
    tx_hash TEXT,
    receipt TEXT,
    is_demo INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    settled_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    task_id TEXT,
    payment_id TEXT,
    direction TEXT NOT NULL,
    kind TEXT NOT NULL,
    counterparty TEXT NOT NULL,
    memo TEXT NOT NULL DEFAULT '',
    amount_cents INTEGER NOT NULL,
    asset TEXT NOT NULL DEFAULT 'USDT0',
    network TEXT NOT NULL DEFAULT 'xlayer-testnet',
    status TEXT NOT NULL DEFAULT 'SETTLED',
    tx_hash TEXT,
    is_demo INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS hire_requests (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    mission_id TEXT,
    provider_id TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'A2A',
    price_cents INTEGER NOT NULL,
    reasons TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'PENDING',
    decided_by TEXT,
    decided_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    label TEXT NOT NULL,
    address TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'AGENTIC',
    network TEXT NOT NULL DEFAULT 'xlayer-testnet',
    is_demo INTEGER NOT NULL DEFAULT 1,
    total_cents INTEGER NOT NULL DEFAULT 0,
    available_cents INTEGER NOT NULL DEFAULT 0,
    escrow_cents INTEGER NOT NULL DEFAULT 0,
    earned_cents INTEGER NOT NULL DEFAULT 0,
    spent_cents INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_company ON task_events(company_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_events_task ON task_events(task_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_mission ON tasks(mission_id)`,
];

// Idempotent column migrations for DBs created before a column existed.
const COLUMN_MIGRATIONS: Array<{ table: string; column: string; ddl: string }> = [
  {
    table: "payments",
    column: "fee_cents",
    ddl: `ALTER TABLE payments ADD COLUMN fee_cents INTEGER NOT NULL DEFAULT 0`,
  },
  {
    table: "payments",
    column: "net_amount_cents",
    ddl: `ALTER TABLE payments ADD COLUMN net_amount_cents INTEGER NOT NULL DEFAULT 0`,
  },
];

export function migrate() {
  for (const stmt of STATEMENTS) sqlite.exec(stmt);
  for (const m of COLUMN_MIGRATIONS) {
    const cols = sqlite.prepare(`PRAGMA table_info(${m.table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === m.column)) sqlite.exec(m.ddl);
  }
}
