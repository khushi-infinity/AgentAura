import "server-only";
import { demoOffers } from "./marketplace";
import type {
  DiscoveryQuery,
  OkxDiscoveryAdapter,
  OkxSettlementAdapter,
  OkxTaskAdapter,
  CreateExternalTaskInput,
  SettleInput,
} from "../types";
import type {
  ExternalTaskHandle,
  ExternalTaskResult,
  ProviderOffer,
  SettlementResult,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// DEMO_MODE adapters (spec §18). Simulate the verified OKX flow through
// the same interfaces as the live adapters. Every result is honestly
// labeled isDemo=true and transactions use fake-but-plausible tx hashes
// prefixed 0x demo — never claimed to be onchain.

function demoTxHash(): string {
  const hex = () =>
    Array.from({ length: 8 }, () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0")).join("");
  return `0xdemo${hex()}${hex()}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Discovery adapter over the demo catalog (stands in for OKX.AI ASP search). */
export class DemoDiscoveryAdapter implements OkxDiscoveryAdapter {
  async discover(query: DiscoveryQuery): Promise<ProviderOffer[]> {
    await sleep(600); // simulate network latency to the marketplace
    return demoOffers({ keywords: query.keywords, maxPriceCents: query.maxPriceCents });
  }
}

/**
 * External task adapter simulating the verified OKX.AI hiring flow:
 * publish task → match ASP → ASP executes → deliverable returned.
 * A2A providers hold funds in escrow until acceptance; A2MCP services
 * settle instantly per call.
 */
export class DemoTaskAdapter implements OkxTaskAdapter {
  async createExternalTask(input: CreateExternalTaskInput): Promise<ExternalTaskHandle> {
    await sleep(700);
    return {
      externalTaskId: `okx-demo-task-${Math.random().toString(36).slice(2, 10)}`,
      providerId: input.provider.providerId,
      providerName: input.provider.providerName,
      status: "CREATED",
      quoteCents: input.provider.priceCents,
      paymentMethod: input.provider.serviceType === "A2A" ? "a2a-escrow" : "x402-exact",
      network: "xlayer-testnet",
      isDemo: true,
    };
  }

  async awaitExternalTask(handle: ExternalTaskHandle): Promise<ExternalTaskResult> {
    // Simulated ASP execution window.
    await sleep(2500);
    return {
      externalTaskId: handle.externalTaskId,
      status: "DELIVERED",
      content: "", // the engine fills a role-appropriate deliverable
      artifactUrl: undefined,
    };
  }
}

/**
 * Settlement adapter simulating the Agent Payments Protocol (x402) flow on
 * X Layer testnet: quote → sign with Agentic Wallet → replay with
 * PAYMENT-SIGNATURE → receipt with txHash.
 */
export class DemoSettlementAdapter implements OkxSettlementAdapter {
  async quote(handle: ExternalTaskHandle) {
    return { amountCents: handle.quoteCents, method: handle.paymentMethod };
  }

  async settle(input: SettleInput): Promise<SettlementResult> {
    await sleep(1200); // signing + onchain submission latency
    return {
      status: "SETTLED",
      txHash: demoTxHash(),
      receipt: `x402 receipt · ${input.handle.paymentMethod} · ${input.handle.network}`,
      network: input.handle.network,
      isDemo: true,
    };
  }
}
