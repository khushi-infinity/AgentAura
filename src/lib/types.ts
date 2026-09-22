// Shared application types used across engine, API and UI.

export type AgentRole =
  | "CEO"
  | "STRATEGY"
  | "RESEARCH"
  | "MARKETING"
  | "PRODUCT"
  | "VERIFICATION";

export type AutonomyPolicy =
  | "ASK_BEFORE_HIRING"
  | "AUTO_HIRE_BELOW_BUDGET"
  | "FULLY_AUTONOMOUS";

export interface PlanStep {
  objective: string;
  role: AgentRole;
  budgetCents: number;
  mayOutsource: boolean;
}

export interface CapabilityGap {
  description: string;
  requiredCapability: string;
  keywords: string[];
  suggestedBudgetCents: number;
}

export interface ProviderOffer {
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceType: "A2A" | "A2MCP";
  category: string;
  tagline: string;
  priceCents: number;
  priceUnit: string;
  reputation: number; // 0-50 (renders as 4.x★)
  completedTasks: number;
  successRate: number;
  capabilities: string[];
  isDemo: boolean;
  taskFit: number; // 0-100
  reasons: string[];
}

export interface ExternalTaskHandle {
  externalTaskId: string;
  providerId: string;
  providerName: string;
  status: "CREATED" | "EXECUTING" | "DELIVERED" | "FAILED";
  quoteCents: number;
  paymentMethod: "x402-exact" | "a2a-escrow";
  network: string;
  isDemo: boolean;
}

export interface ExternalTaskResult {
  externalTaskId: string;
  status: "DELIVERED" | "FAILED";
  content: string;
  artifactUrl?: string;
}

export interface SettlementResult {
  status: "SETTLED" | "FAILED";
  txHash?: string;
  receipt?: string;
  network: string;
  isDemo: boolean;
  error?: string;
}

export interface VerificationOutcome {
  passed: boolean;
  score: number; // 0-100
  notes: string;
}

export const ROLE_META: Record<
  AgentRole,
  { name: string; avatar: string; description: string; color: string }
> = {
  CEO: {
    name: "CEO Agent",
    avatar: "CEO",
    description: "Orchestrates missions, delegates work, detects capability gaps",
    color: "plum",
  },
  STRATEGY: {
    name: "Strategy Agent",
    avatar: "STRATEGY",
    description: "Planning and positioning",
    color: "teal",
  },
  RESEARCH: {
    name: "Research Agent",
    avatar: "RESEARCH",
    description: "Research and analysis",
    color: "leaf",
  },
  MARKETING: {
    name: "Marketing Agent",
    avatar: "MARKETING",
    description: "Content and growth",
    color: "gold",
  },
  PRODUCT: {
    name: "Product Agent",
    avatar: "PRODUCT",
    description: "Build and launch execution",
    color: "sky",
  },
  VERIFICATION: {
    name: "Verification Agent",
    avatar: "VERIFICATION",
    description: "Quality check and validation",
    color: "leaf-deep",
  },
};

export const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned",
  ASSIGNED: "Assigned",
  EXECUTING: "Executing",
  OUTSOURCING: "Outsourcing",
  AWAITING_PROVIDER: "Awaiting provider",
  DELIVERED: "Delivered",
  VERIFYING: "Verifying",
  VERIFIED: "Verified",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  COMPLETED: "Completed",
  FAILED: "Failed",
  RETRYING: "Retrying",
  REJECTED: "Rejected",
  REWORK_REQUIRED: "Rework required",
  PAYMENT_FAILED: "Payment failed",
  ESCALATION: "Escalation",
  DRAFT: "Draft",
  ACTIVE: "Active",
  IDLE: "Idle",
  WORKING: "Working",
  OFFLINE: "Offline",
  INTERNAL: "Internal",
  EXTERNAL: "External",
};
