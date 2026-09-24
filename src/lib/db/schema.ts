import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  // Founder identity — one row, shown everywhere (home greeting, sidebar,
  // settings). Editable in Settings → Profile.
  founderName: text("founder_name").notNull().default("Jane Doe"),
  mission: text("mission"),
  budgetCents: integer("budget_cents").notNull().default(1000),
  autonomyPolicy: text("autonomy_policy").notNull().default("ASK_BEFORE_HIRING"),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // CEO | STRATEGY | RESEARCH | MARKETING | PRODUCT | VERIFICATION
  type: text("type").notNull().default("INTERNAL"), // INTERNAL | EXTERNAL
  avatar: text("avatar").notNull().default("agents"),
  description: text("description").notNull().default(""),
  capabilities: text("capabilities").notNull().default("[]"), // JSON string[]
  status: text("status").notNull().default("IDLE"), // IDLE | WORKING | OFFLINE
  taskCount: integer("task_count").notNull().default(0),
  successRate: integer("success_rate").notNull().default(100),
  externalProviderId: text("external_provider_id"),
  externalServiceUrl: text("external_service_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const missions = sqliteTable("missions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  objective: text("objective").notNull(),
  status: text("status").notNull().default("ACTIVE"), // DRAFT | ACTIVE | COMPLETED
  priority: text("priority").notNull().default("HIGH"), // HIGH | MEDIUM | LOW
  progress: integer("progress").notNull().default(0),
  totalTasks: integer("total_tasks").notNull().default(0),
  completedTasks: integer("completed_tasks").notNull().default(0),
  spendCents: integer("spend_cents").notNull().default(0),
  summary: text("summary"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  missionId: text("mission_id").notNull(),
  parentTaskId: text("parent_task_id"),
  requesterAgentId: text("requester_agent_id"),
  assigneeAgentId: text("assignee_agent_id"),
  role: text("role").notNull().default("RESEARCH"),
  objective: text("objective").notNull(),
  status: text("status").notNull().default("PLANNED"),
  budgetCents: integer("budget_cents").notNull().default(0),
  spendCents: integer("spend_cents").notNull().default(0),
  isOutsourced: integer("is_outsourced", { mode: "boolean" }).notNull().default(false),
  externalProviderId: text("external_provider_id"),
  externalTaskRef: text("external_task_ref"),
  capabilityGap: text("capability_gap"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const taskEvents = sqliteTable("task_events", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  taskId: text("task_id"),
  missionId: text("mission_id"),
  type: text("type").notNull(),
  actorId: text("actor_id"),
  actorName: text("actor_name"),
  title: text("title").notNull(),
  detail: text("detail"),
  payload: text("payload").notNull().default("{}"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const deliverables = sqliteTable("deliverables", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  content: text("content").notNull(),
  artifactUrl: text("artifact_url"),
  verificationStatus: text("verification_status").notNull().default("PENDING"), // PENDING | VERIFIED | REJECTED
  verificationScore: integer("verification_score").notNull().default(0),
  verifierAgentId: text("verifier_agent_id"),
  verificationNotes: text("verification_notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const externalProviders = sqliteTable("external_providers", {
  id: text("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  serviceId: text("service_id").notNull(),
  serviceType: text("service_type").notNull().default("A2A"), // A2A | A2MCP
  category: text("category").notNull().default("Research"),
  tagline: text("tagline").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(50),
  priceUnit: text("price_unit").notNull().default("task"), // task | call
  reputation: integer("reputation").notNull().default(46), // 0-50 → 4.6★
  completedTasks: integer("completed_tasks").notNull().default(0),
  successRate: integer("success_rate").notNull().default(95),
  capabilities: text("capabilities").notNull().default("[]"), // JSON string[]
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
  metadata: text("metadata").notNull().default("{}"),
});

export const memoryItems = sqliteTable("memory_items", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  type: text("type").notNull().default("INSIGHT"), // INSIGHT | RESEARCH | DECISION | LEARNING | DOCUMENT
  folder: text("folder").notNull().default("research"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceAgentId: text("source_agent_id"),
  sourceAgentName: text("source_agent_name"),
  sourceTaskId: text("source_task_id"),
  externalProviderId: text("external_provider_id"),
  confidence: integer("confidence").notNull().default(80), // 0-100
  verificationStatus: text("verification_status").notNull().default("UNVERIFIED"), // VERIFIED | UNVERIFIED | REJECTED
  tags: text("tags").notNull().default("[]"), // JSON string[]
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  taskId: text("task_id"),
  missionId: text("mission_id"),
  providerName: text("provider_name").notNull(),
  providerId: text("provider_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USDT0"),
  network: text("network").notNull().default("xlayer-testnet"),
  status: text("status").notNull().default("PENDING"), // PENDING | SETTLED | FAILED
  method: text("method").notNull().default("x402-exact"), // x402-exact | a2a-escrow
  escrowed: integer("escrowed", { mode: "boolean" }).notNull().default(false),
  txHash: text("tx_hash"),
  receipt: text("receipt"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  settledAt: integer("settled_at", { mode: "timestamp" }),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  taskId: text("task_id"),
  paymentId: text("payment_id"),
  direction: text("direction").notNull(), // OUT | IN
  kind: text("kind").notNull(), // AGENT_PAYMENT | MISSION_FUNDING | TASK_REWARD | EXTERNAL_PAYMENT
  counterparty: text("counterparty").notNull(),
  memo: text("memo").notNull().default(""),
  amountCents: integer("amount_cents").notNull(),
  asset: text("asset").notNull().default("USD₮0"),
  network: text("network").notNull().default("xlayer-testnet"),
  status: text("status").notNull().default("SETTLED"),
  txHash: text("tx_hash"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const hireRequests = sqliteTable("hire_requests", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  taskId: text("task_id").notNull(),
  missionId: text("mission_id"),
  providerId: text("provider_id").notNull(),
  providerName: text("provider_name").notNull(),
  serviceType: text("service_type").notNull().default("A2A"),
  priceCents: integer("price_cents").notNull(),
  reasons: text("reasons").notNull().default("[]"), // JSON string[] — explainable selection (spec §10)
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | DECLINED | EXPIRED
  decidedBy: text("decided_by"), // "user" | autonomy policy
  decidedAt: integer("decided_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  label: text("label").notNull(),
  address: text("address").notNull(),
  kind: text("kind").notNull().default("AGENTIC"), // TREASURY | AGENTIC
  network: text("network").notNull().default("xlayer-testnet"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(true),
  totalCents: integer("total_cents").notNull().default(0),
  availableCents: integer("available_cents").notNull().default(0),
  escrowCents: integer("escrow_cents").notNull().default(0),
  earnedCents: integer("earned_cents").notNull().default(0),
  spentCents: integer("spent_cents").notNull().default(0),
});

// Domain event types per spec §20
export const TASK_EVENT_TYPES = [
  "TASK_CREATED",
  "TASK_ASSIGNED",
  "TASK_STARTED",
  "CAPABILITY_GAP_DETECTED",
  "SERVICE_DISCOVERY_STARTED",
  "SERVICE_DISCOVERY_COMPLETED",
  "PROVIDER_SELECTED",
  "EXTERNAL_TASK_CREATED",
  "PAYMENT_QUOTED",
  "PAYMENT_STARTED",
  "EXTERNAL_TASK_DELIVERED",
  "VERIFICATION_STARTED",
  "VERIFICATION_PASSED",
  "VERIFICATION_FAILED",
  "PAYMENT_SETTLED",
  "MEMORY_CREATED",
  "REPUTATION_UPDATED",
  "MISSION_COMPLETED",
] as const;

export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];

// Task state machine per spec §14
export const TASK_STATUSES = [
  "PLANNED",
  "ASSIGNED",
  "EXECUTING",
  "OUTSOURCING",
  "AWAITING_PROVIDER",
  "DELIVERED",
  "VERIFYING",
  "VERIFIED",
  "PAYMENT_PENDING",
  "PAID",
  "COMPLETED",
  "FAILED",
  "RETRYING",
  "REJECTED",
  "REWORK_REQUIRED",
  "PAYMENT_FAILED",
  "ESCALATION",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
