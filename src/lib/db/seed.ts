import { db, sqlite } from "./index";
import {
  agents,
  companies,
  externalProviders,
  memoryItems,
  missions,
  tasks,
  transactions,
  wallets,
} from "./schema";
import { DEMO_SERVICES } from "@/lib/okx/demo/marketplace";
import { migrate } from "./migrate";
import fs from "fs";
import path from "path";

// Seed/demo data (spec §8 Analytics: "Seeded demo data must be clearly
// demo data"). Safe to re-run: wipes and re-creates the dataset.

function rid(prefix: string, n = 6): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 2 + n)}`;
}

const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 86_400_000 - h * 3_600_000);

export function seed() {
  // wipe (order matters for readability only; sqlite has no FKs enforced here)
  sqlite.exec("PRAGMA foreign_keys = OFF");
  for (const t of [
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
  ]) {
    db.run(`DELETE FROM ${t}`);
  }

  // ── Company ───────────────────────────────────────────────────────
  const companyId = "co_demo";
  db.insert(companies)
    .values({
      id: companyId,
      name: "Acme AI",
      description: "AI-powered developer productivity tool",
      mission: "Launch our product and get first 100 users",
      budgetCents: 500,
      autonomyPolicy: "AUTO_HIRE_BELOW_BUDGET",
      status: "ACTIVE",
      createdAt: daysAgo(12),
    })
    .run();

  // ── Wallet ──────────────────────────────────────────────────────────
  db.insert(wallets)
    .values({
      id: "wal_demo",
      companyId,
      label: "Company Treasury (Agentic Wallet)",
      address: "0xAa1C...7f42",
      kind: "AGENTIC",
      network: "xlayer-testnet",
      isDemo: true,
      totalCents: 433,
      availableCents: 433,
      escrowCents: 0,
      earnedCents: 0,
      spentCents: 67,
    })
    .run();

  // ── Agents ──────────────────────────────────────────────────────────
  const roster = [
    { role: "CEO", name: "CEO Agent", avatar: "👑", desc: "Orchestrates missions and delegates work", tasks: 12 },
    { role: "STRATEGY", name: "Strategy Agent", avatar: "🧭", desc: "Planning and positioning", tasks: 8 },
    { role: "RESEARCH", name: "Research Agent", avatar: "🔬", desc: "Research and analysis", tasks: 9 },
    { role: "MARKETING", name: "Marketing Agent", avatar: "📣", desc: "Content and growth", tasks: 7 },
    { role: "PRODUCT", name: "Product Agent", avatar: "🛠️", desc: "Build and launch execution", tasks: 5 },
    { role: "VERIFICATION", name: "Verification Agent", avatar: "🛡️", desc: "Quality check and validation", tasks: 11 },
  ];
  for (const r of roster) {
    db.insert(agents)
      .values({
        id: `agent_${r.role.toLowerCase()}`,
        companyId,
        name: r.name,
        role: r.role,
        type: "INTERNAL",
        avatar: r.avatar,
        description: r.desc,
        capabilities: JSON.stringify([r.role.toLowerCase(), "planning", "collaboration"]),
        status: "IDLE",
        taskCount: r.tasks,
        successRate: 96,
        createdAt: daysAgo(12),
      })
      .run();
  }

  // ── External providers (from the demo marketplace catalog) ─────────
  for (const s of DEMO_SERVICES) {
    db.insert(externalProviders)
      .values({
        id: s.providerId,
        providerName: s.providerName,
        serviceId: s.serviceId,
        serviceType: s.serviceType,
        category: s.category,
        tagline: s.tagline,
        priceCents: s.priceCents,
        priceUnit: s.priceUnit,
        reputation: s.reputation,
        completedTasks: s.completedTasks,
        successRate: s.successRate,
        capabilities: JSON.stringify(s.capabilities),
        isDemo: true,
      })
      .run();
  }

  // ── Missions (one active, one completed, one draft) ─────────────────
  const m1 = "mis_launch100";
  const m2 = "mis_feedback";
  const m3 = "mis_intl";
  db.insert(missions)
    .values([
      {
        id: m1,
        companyId,
        objective: "Launch our product and get first 100 users",
        status: "ACTIVE",
        priority: "HIGH",
        progress: 40,
        totalTasks: 5,
        completedTasks: 2,
        spendCents: 50,
        createdAt: daysAgo(2),
      },
      {
        id: m2,
        companyId,
        objective: "Improve product based on user feedback",
        status: "ACTIVE",
        priority: "MEDIUM",
        progress: 0,
        totalTasks: 4,
        completedTasks: 0,
        createdAt: daysAgo(1),
      },
      {
        id: m3,
        companyId,
        objective: "Explore international markets",
        status: "DRAFT",
        priority: "LOW",
        createdAt: daysAgo(0, 5),
      },
    ])
    .run();

  // ── Historical tasks for the active mission ─────────────────────────
  const histTasks = [
    { id: rid("task"), role: "STRATEGY", objective: "Define audience, positioning and launch metrics", status: "COMPLETED", spend: 0, outsourced: false },
    { id: rid("task"), role: "RESEARCH", objective: "Market and competitor research for launch", status: "COMPLETED", spend: 50, outsourced: true },
    { id: rid("task"), role: "MARKETING", objective: "Draft launch content plan and first assets", status: "EXECUTING", spend: 0, outsourced: false },
  ];
  for (const t of histTasks) {
    db.insert(tasks)
      .values({
        id: t.id,
        companyId,
        missionId: m1,
        role: t.role,
        objective: t.objective,
        status: t.status,
        budgetCents: t.spend || 50,
        spendCents: t.spend,
        isOutsourced: t.outsourced,
        externalProviderId: t.outsourced ? "prov_market-intel" : null,
        createdAt: daysAgo(1, 3),
        completedAt: t.status === "COMPLETED" ? daysAgo(0, 6) : null,
      })
      .run();
  }

  // ── Company Memory ──────────────────────────────────────────────────
  const mems = [
    {
      type: "RESEARCH",
      folder: "research",
      title: "Competitor pricing analysis",
      content:
        "Three direct competitors analyzed. Incumbents win on distribution and integrations; lose on onboarding friction and opaque pricing. Opportunity: transparent usage-based pricing and automation-first onboarding.",
      agent: "Research Agent",
      conf: 92,
      verified: "VERIFIED",
      tags: ["research", "competitors", "pricing"],
      d: 1,
      provider: "prov_market-intel",
    },
    {
      type: "INSIGHT",
      folder: "marketing",
      title: "Technical case studies perform 2.4x better",
      content:
        "Across 18 published pieces, technical case studies drove 2.4x more qualified signups than feature announcements. Prioritize engineering-led narratives.",
      agent: "Marketing Agent",
      conf: 85,
      verified: "VERIFIED",
      tags: ["marketing", "content", "insight"],
      d: 2,
      provider: null,
    },
    {
      type: "LEARNING",
      folder: "product",
      title: "User feedback on onboarding",
      content:
        "First 12 beta users: 9 completed sign-up; drop-off concentrated at workspace-setup step. Recommendation: defer setup, land users into a pre-filled sandbox.",
      agent: "Product Agent",
      conf: 78,
      verified: "UNVERIFIED",
      tags: ["product", "onboarding", "feedback"],
      d: 1,
      provider: null,
    },
    {
      type: "DECISION",
      folder: "decisions",
      title: "Pricing: usage-based over seat-based",
      content:
        "Decision: adopt usage-based pricing for launch. Rationale: aligns with agent-economy positioning and competitor weakness identified in research.",
      agent: "CEO Agent",
      conf: 95,
      verified: "VERIFIED",
      tags: ["decision", "pricing"],
      d: 3,
      provider: null,
    },
    {
      type: "DOCUMENT",
      folder: "operations",
      title: "High-performing content formats",
      content:
        "Format leaderboard: 1) technical case studies, 2) teardown posts, 3) short video demos. Templates stored for reuse in upcoming missions.",
      agent: "Marketing Agent",
      conf: 80,
      verified: "VERIFIED",
      tags: ["marketing", "templates"],
      d: 4,
      provider: null,
    },
  ];
  for (const m of mems) {
    db.insert(memoryItems)
      .values({
        id: rid("mem"),
        companyId,
        type: m.type,
        folder: m.folder,
        title: m.title,
        content: m.content,
        sourceAgentName: m.agent,
        externalProviderId: m.provider,
        confidence: m.conf,
        verificationStatus: m.verified,
        tags: JSON.stringify(m.tags),
        createdAt: daysAgo(m.d),
      })
      .run();
  }

  // ── Historical transactions (clearly demo) ──────────────────────────
  db.insert(transactions)
    .values([
      {
        id: rid("tx"),
        companyId,
        direction: "OUT",
        kind: "EXTERNAL_PAYMENT",
        counterparty: "MarketMind Labs",
        memo: "Competitor research report",
        amountCents: 50,
        txHash: "0xdemo9f2c41ab77e3",
        isDemo: true,
        createdAt: daysAgo(0, 6),
      },
      {
        id: rid("tx"),
        companyId,
        direction: "OUT",
        kind: "AGENT_PAYMENT",
        counterparty: "ContentForge",
        memo: "Launch thread (3 parts)",
        amountCents: 17,
        txHash: "0xdemo41ba90ce12d5",
        isDemo: true,
        createdAt: daysAgo(2),
      },
      {
        id: rid("tx"),
        companyId,
        direction: "IN",
        kind: "MISSION_FUNDING",
        counterparty: "Founder",
        memo: "Mission funding — launch budget",
        amountCents: 500,
        txHash: "0xdemo77ac31fe09b2",
        isDemo: true,
        createdAt: daysAgo(12),
      },
    ])
    .run();

  console.log("✓ Seed complete: company, 6 agents, 8 providers, 3 missions, memory, transactions");
}

if (require.main === module) {
  migrate();
  seed();
}
