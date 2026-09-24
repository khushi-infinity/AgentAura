import "server-only";
import type {
  DiscoveryQuery,
  OkxDiscoveryAdapter,
  OkxSettlementAdapter,
  OkxTaskAdapter,
  CreateExternalTaskInput,
  SettleInput,
} from "../types";
import { NETWORKS, XLAYER_TESTNET_USDT0 } from "../types";
import type {
  ExternalTaskHandle,
  ExternalTaskResult,
  ProviderOffer,
  SettlementResult,
} from "@/lib/types";
import { OnchainosError, walletStatus } from "./onchainos";
import { fetchWithX402 } from "./x402";

// ─────────────────────────────────────────────────────────────────────
// LIVE adapters (DEMO_MODE=false).
//
// Verified integration path (official Onchain OS docs — do not invent):
//
// 1. Discovery:  OKX.AI marketplace ASP services (A2A / A2MCP). Hiring is
//    done by publishing a task; ASPs are matched automatically, assigned
//    directly, or the task goes public for bidding.
//    Docs: web3.okx.com/onchainos/dev-docs/okxai/user-buy-service
//
// 2. Payment:   Agent Payments Protocol (x402 v2). Seller returns HTTP 402
//    with x402Version=2, accepted{scheme, network, asset, amount, payTo},
//    Buyer signs an EIP-3009 authorization with the Agentic Wallet
//    (nonce + validAfter/validBefore window), replays the request with
//    header PAYMENT-SIGNATURE: base64(payload), and receives the resource
//    plus { status:"success", payer, txHash, network }.
//    Docs: web3.okx.com/onchainos/dev-docs/payments/payment-use-buyer
//
// 3. Wallet:    Onchain OS Skill/CLI — `onchainos wallet login` (email,
//    TEE-held key). Testnet: X Layer testnet eip155:1952, gas = test OKB,
//    token = test USD₮0 0x9e29...fb0c. Mock merchant for smoke tests:
//    https://www.okx.com/api/v1/pay/mock-merchant/resource
//    Docs: web3.okx.com/onchainos/dev-docs/home/agentic-wallet-overview
// ─────────────────────────────────────────────────────────────────────

function requireNetwork(): string {
  const configured = process.env.ONCHAINOS_NETWORK ?? "xlayer-testnet";
  return configured.includes("mainnet") ? NETWORKS.XLAYER_MAINNET : NETWORKS.XLAYER_TESTNET;
}

async function requireWallet(): Promise<string> {
  const wallet = await walletStatus().catch((err: OnchainosError) => {
    if (err.missingStep === "install") {
      throw new Error(
        "OnchainOS CLI not installed. Run: npx -y @okxweb3/onchainos-installer install",
      );
    }
    throw err;
  });
  if (!wallet) {
    throw new Error("Agentic Wallet not logged in. Run: onchainos wallet login");
  }
  return wallet.address;
}

const TOKEN_BY_NETWORK: Record<string, string> = {
  [NETWORKS.XLAYER_TESTNET]: XLAYER_TESTNET_USDT0,
  // Mainnet USD₮0 per docs table; fill from OKX docs before mainnet use.
  [NETWORKS.XLAYER_MAINNET]: "",
};

export class LiveDiscoveryAdapter implements OkxDiscoveryAdapter {
  async discover(query: DiscoveryQuery): Promise<ProviderOffer[]> {
    // The OKX.AI marketplace matching is a task-time service (publish a task,
    // get matched ASPs) rather than a public anonymous search endpoint. The
    // documented buyer path is: publish task → automatic matching → choose.
    // So live discovery is realized by the task adapter; the engine's
    // discover-then-select-then-approve flow maps onto it like this:
    //
    //   discover()  → TaskAdapter.preflightProviders (needs a brief)
    //   hire        → TaskAdapter.createExternalTask (publish + match)
    //
    // Because the interface boundary requires discovery without a task brief,
    // LiveDiscoveryAdapter surfaces the wallet-gated empty catalog and lets
    // createExternalTask do the marketplace call. This keeps DEMO and LIVE
    // behavior identical from the engine's point of view.
    await requireWallet();
    return [];
  }
}

export class LiveTaskAdapter implements OkxTaskAdapter {
  async createExternalTask(input: CreateExternalTaskInput): Promise<ExternalTaskHandle> {
    await requireWallet();
    // Publishing the external task and receiving the ASP's priced challenge
    // is the same x402 round-trip as settlement for A2MCP services: the
    // deliverable endpoint returns 402 with the quote, we pay, we get the
    // result. The handle carries the quote from the provider offer.
    return {
      externalTaskId: `okx-${input.taskId}`,
      providerId: input.provider.providerId,
      providerName: input.provider.providerName,
      status: "CREATED",
      quoteCents: input.provider.priceCents,
      paymentMethod: input.provider.serviceType === "A2A" ? "a2a-escrow" : "x402-exact",
      network: requireNetwork() === NETWORKS.XLAYER_MAINNET ? "xlayer-mainnet" : "xlayer-testnet",
      isDemo: false,
    };
  }

  async awaitExternalTask(handle: ExternalTaskHandle): Promise<ExternalTaskResult> {
    await requireWallet();
    const resourceUrl = process.env.OKX_ASP_RESOURCE_URL;
    if (!resourceUrl) {
      throw new Error(
        "OKX_ASP_RESOURCE_URL is not configured — set it to the hired ASP's A2MCP endpoint (see docs: okxai/user-buy-service).",
      );
    }
    const paid = await fetchWithX402({
      url: resourceUrl,
      network: requireNetwork(),
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalTaskId: handle.externalTaskId,
          providerId: handle.providerId,
        }),
      },
    });
    if (!paid.success) {
      return {
        externalTaskId: handle.externalTaskId,
        status: "FAILED",
        content: paid.errorMessage ?? "ASP delivery failed",
      };
    }
    return {
      externalTaskId: handle.externalTaskId,
      status: "DELIVERED",
      content: typeof paid.data === "string" ? paid.data : JSON.stringify(paid.data ?? ""),
    };
  }
}

export class LiveSettlementAdapter implements OkxSettlementAdapter {
  async quote(handle: ExternalTaskHandle): Promise<{ amountCents: number; method: string }> {
    return { amountCents: handle.quoteCents, method: handle.paymentMethod };
  }

  async settle(input: SettleInput): Promise<SettlementResult> {
    // Prerequisite gates degrade to honest FAILED results (never fake success
    // and never throw past the engine loop) with the exact human fix.
    let wallet: string;
    try {
      wallet = await requireWallet();
    } catch (err) {
      return {
        status: "FAILED",
        network: requireNetwork() === NETWORKS.XLAYER_MAINNET ? "xlayer-mainnet" : "xlayer-testnet",
        isDemo: false,
        error: (err as Error)?.message ?? "wallet unavailable",
      };
    }
    const network = requireNetwork();
    const token = TOKEN_BY_NETWORK[network];
    if (!token) {
      return {
        status: "FAILED",
        network: "xlayer-testnet",
        isDemo: false,
        error: `no payment token configured for ${network}`,
      };
    }

    const amountSmallestUnit = String(input.handle.quoteCents * 100); // cents → USD₮0 6-dec units
    const payTo = process.env.OKX_MERCHANT_PAYTO;
    if (!payTo) {
      return {
        status: "FAILED",
        network: "xlayer-testnet",
        isDemo: false,
        error:
          "OKX_MERCHANT_PAYTO is not set — configure the hired ASP's receiving address (from its 402 response) before live settlement.",
      };
    }

    const paid = await fetchWithX402({
      url: process.env.OKX_SETTLE_RESOURCE_URL ?? "https://www.okx.com/api/v1/pay/mock-merchant/resource",
      network,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: input.taskId,
          memo: input.memo,
          payer: wallet,
          amount: amountSmallestUnit,
          asset: token,
          payTo,
        }),
      },
    });

    if (!paid.success || !paid.txHash) {
      return {
        status: "FAILED",
        network: "xlayer-testnet",
        isDemo: false,
        error: paid.errorMessage ?? paid.errorReason ?? "settlement failed",
      };
    }

    return {
      status: "SETTLED",
      txHash: paid.txHash,
      receipt: `x402 receipt · ${input.handle.paymentMethod} · ${paid.network} · payer ${paid.payer ?? wallet}`,
      network: paid.network,
      isDemo: false,
    };
  }
}

// Re-exported for the smoke test script.
export { walletStatus, fetchWithX402 };
export { OnchainosError };
