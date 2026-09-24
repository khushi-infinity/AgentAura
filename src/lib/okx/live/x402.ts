import "server-only";
import { signX402Authorization } from "./onchainos";

// x402 v2 buyer flow, implemented exactly per the official quickstart
// (web3.okx.com/onchainos/dev-docs/payments/payment-use-buyer):
//
//   1. GET the priced resource → seller replies HTTP 402 with a JSON body:
//      { x402Version: 2, resource, accepts: [PaymentRequirements…] }
//   2. Pick the "exact" (one-time EIP-3009) option for our network/token.
//   3. Sign the authorization with the Agentic Wallet (TEE-held key).
//   4. Replay the request with header
//      PAYMENT-SIGNATURE: base64(PaymentPayload JSON)
//   5. Seller verifies+settles via the facilitator and returns the resource
//      plus { payment: { status:"success", payer, txHash, network } }.
//
// Types mirror @okxweb3/x402-core (docs: payments/sdk-nodejs). We speak the
// wire protocol directly rather than pulling the SDK so the server bundle
// stays dependency-free; shapes are identical.

export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds?: number;
  extra?: Record<string, unknown>;
}

export interface PaymentRequired {
  x402Version: number;
  error?: string;
  resource: { url: string; description?: string; mimeType?: string };
  accepts: PaymentRequirements[];
}

export interface SettleResponse {
  success: boolean;
  payer?: string;
  txHash?: string;
  network: string;
  data?: unknown;
  errorReason?: string;
  errorMessage?: string;
}

const X402_VERSION = 2;

function pickAccepted(pr: PaymentRequired, network: string): PaymentRequirements | null {
  const exact = pr.accepts.find(
    (a) => a.scheme === "exact" && (!a.network || a.network === network),
  );
  return exact ?? pr.accepts.find((a) => !a.network || a.network === network) ?? null;
}

function encodePaymentPayload(args: {
  requirements: PaymentRequirements;
  resourceUrl: string;
  payload: { signature: string; authorization: Record<string, string> };
}): string {
  const body = {
    x402Version: X402_VERSION,
    resource: { url: args.resourceUrl, mimeType: "application/json" },
    accepted: args.requirements,
    payload: args.payload,
  };
  return Buffer.from(JSON.stringify(body), "utf8").toString("base64");
}

/**
 * Fetch a priced resource, paying the x402 "exact" challenge if the seller
 * responds 402. Returns the resource body plus the on-chain settlement info.
 */
export async function fetchWithX402(args: {
  url: string;
  network: string; // CAIP-2, e.g. eip155:1952
  init?: RequestInit;
}): Promise<SettleResponse> {
  // 1. First attempt — expect the 402 challenge.
  const first = await fetch(args.url, { ...args.init, headers: { ...args.init?.headers } });
  if (first.status !== 402) {
    // Either free or an unexpected status; pass the body through.
    const data = await first.json().catch(() => null);
    return {
      success: first.ok,
      network: args.network,
      data,
      errorMessage: first.ok ? undefined : `unexpected status ${first.status}`,
    };
  }

  const challenge = (await first.json().catch(() => null)) as PaymentRequired | null;
  if (!challenge?.accepts?.length) {
    return { success: false, network: args.network, errorMessage: "402 without accepts[]" };
  }

  // 2. Choose the exact/one-time option.
  const requirements = pickAccepted(challenge, args.network);
  if (!requirements) {
    return { success: false, network: args.network, errorMessage: "no acceptable payment option in 402" };
  }

  // 3. Sign via the Agentic Wallet (TEE).
  const { payload } = await signX402Authorization({
    requirements,
    resourceUrl: challenge.resource?.url ?? args.url,
  });

  // 4. Replay with PAYMENT-SIGNATURE.
  const sig = encodePaymentPayload({ requirements, resourceUrl: challenge.resource?.url ?? args.url, payload });
  const second = await fetch(args.url, {
    ...args.init,
    headers: { ...args.init?.headers, "PAYMENT-SIGNATURE": sig },
  });

  const data = (await second.json().catch(() => null)) as
    | { data?: unknown; payment?: { status?: string; payer?: string; txHash?: string; network?: string } }
    | null;

  if (!second.ok) {
    return {
      success: false,
      network: args.network,
      data,
      errorMessage: `paid replay failed with status ${second.status}`,
    };
  }

  return {
    success: data?.payment?.status === "success",
    payer: data?.payment?.payer,
    txHash: data?.payment?.txHash,
    network: data?.payment?.network ?? args.network,
    data: data?.data,
    errorReason: data?.payment?.status !== "success" ? "payment_not_success" : undefined,
    errorMessage: data?.payment?.status !== "success" ? `payment status: ${data?.payment?.status ?? "unknown"}` : undefined,
  };
}
