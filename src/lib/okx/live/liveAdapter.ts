import "server-only";
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
// LIVE adapters (DEMO_MODE=false).
//
// Verified integration path (official Onchain OS docs — do not invent):
//
// 1. Discovery:  OKX.AI marketplace services. Hire by publishing a task
//    (talk-to-agent task creation or manual ASP selection on the web).
//    A2A = negotiated scope + onchain escrow released on acceptance.
//    A2MCP = fixed price per call, settled instantly via Payment SDK.
//    Docs: web3.okx.com/onchainos/dev-docs/okxai/asp-introduction
//          web3.okx.com/onchainos/dev-docs/okxai/user-buy-service
//
// 2. Payment:   Agent Payments Protocol (x402 v2). Seller returns HTTP 402
//    with x402Version=2, accepted{scheme, network, asset, amount, payTo},
//    Buyer signs an EIP-3009 authorization with the Agentic Wallet
//    (nonce + validAfter/validBefore window), replays the request with
//    header PAYMENT-SIGNATURE: base64(payload), and receives the resource
//    plus { status:"success", payer, txHash, network }.
//    Docs: web3.okx.com/onchainos/dev-docs/payments/app
//          web3.okx.com/onchainos/dev-docs/payments/payment-use-buyer
//
// 3. Wallet:    Onchain OS Skill/CLI — `onchainos wallet login` (email,
//    TEE-held key). Testnet: X Layer testnet eip155:1952, gas = test OKB,
//    token = test USD₮0 0x9e29...fb0c. Mock merchant for smoke tests:
//    https://www.okx.com/api/v1/pay/mock-merchant/resource
//    Docs: web3.okx.com/onchainos/dev-docs/home/agentic-wallet-overview
// ─────────────────────────────────────────────────────────────────────

export class LiveDiscoveryAdapter implements OkxDiscoveryAdapter {
  async discover(_query: DiscoveryQuery): Promise<ProviderOffer[]> {
    throw new Error(
      "Live OKX.AI discovery not yet wired. Onchain OS skills must be installed (npx -y @okxweb3/onchainos-installer install) and the Agentic Wallet logged in before enabling DEMO_MODE=false."
    );
  }
}

export class LiveTaskAdapter implements OkxTaskAdapter {
  async createExternalTask(_input: CreateExternalTaskInput): Promise<ExternalTaskHandle> {
    throw new Error("Live OKX.AI external task creation not yet wired.");
  }
  async awaitExternalTask(_handle: ExternalTaskHandle): Promise<ExternalTaskResult> {
    throw new Error("Live OKX.AI external task execution not yet wired.");
  }
}

export class LiveSettlementAdapter implements OkxSettlementAdapter {
  async quote(_handle: ExternalTaskHandle): Promise<{ amountCents: number; method: string }> {
    throw new Error("Live settlement quote not yet wired.");
  }
  async settle(_input: SettleInput): Promise<SettlementResult> {
    throw new Error(
      "Live x402 settlement not yet wired. Requires Agentic Wallet session (onchainos wallet login) and testnet OKB + USD₮0."
    );
  }
}
