// Shared types for the OKX adapter layer. Re-exports the engine-facing
// offer/handle/result/settlement types and defines adapter interfaces.

import type {
  ProviderOffer,
  ExternalTaskHandle,
  ExternalTaskResult,
  SettlementResult,
} from "@/lib/types";

export type { ProviderOffer, ExternalTaskHandle, ExternalTaskResult, SettlementResult };

export interface DiscoveryQuery {
  intent: string; // natural-language capability need
  keywords: string[];
  maxPriceCents?: number;
}

export interface CreateExternalTaskInput {
  provider: ProviderOffer;
  objective: string;
  brief: string;
  budgetCents: number;
  companyId: string;
  taskId: string;
}

export interface SettleInput {
  taskId: string;
  handle: ExternalTaskHandle;
  memo: string;
}

export interface OkxDiscoveryAdapter {
  discover(query: DiscoveryQuery): Promise<ProviderOffer[]>;
}

export interface OkxTaskAdapter {
  createExternalTask(input: CreateExternalTaskInput): Promise<ExternalTaskHandle>;
  awaitExternalTask(handle: ExternalTaskHandle): Promise<ExternalTaskResult>;
}

export interface OkxSettlementAdapter {
  quote(handle: ExternalTaskHandle): Promise<{ amountCents: number; method: string }>;
  settle(input: SettleInput): Promise<SettlementResult>;
}

export const NETWORKS = {
  XLAYER_TESTNET: "eip155:1952",
  XLAYER_MAINNET: "eip155:196",
} as const;

// Verified contract addresses from the official "My Agent buys services"
// quickstart (web3.okx.com/onchainos/dev-docs/payments/payment-use-buyer)
export const XLAYER_TESTNET_USDT0 = "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c";
