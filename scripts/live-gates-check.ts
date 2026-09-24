/* Verify the live adapters fail loudly with actionable instructions when the
 * OnchainOS prerequisites are missing — the honest-failure design must hold.
 * Run: DEMO_MODE=false npx tsx scripts/live-gates-check.ts
 */
import { getDiscoveryAdapter, getSettlementAdapter } from "../src/lib/okx/index";
import type { ExternalTaskHandle } from "../src/lib/types";

async function main() {
  console.log("DEMO_MODE =", process.env.DEMO_MODE ?? "(unset=true)");

  // 1. Discovery should throw with the wallet/install instruction.
  try {
    await getDiscoveryAdapter().discover({ intent: "x", keywords: [] });
    console.log("✗ discovery returned without a wallet session — gate is broken");
    process.exitCode = 1;
  } catch (e) {
    console.log("✓ discovery gated:", (e as Error).message.slice(0, 90));
  }

  // 2. Settlement should fail as FAILED with an actionable error (engine
  //    treats adapter errors as task failures, so settle() returns rather
  //    than throwing — but it must NOT pretend success).
  const handle: ExternalTaskHandle = {
    externalTaskId: "e1",
    providerId: "p",
    providerName: "P",
    status: "CREATED",
    quoteCents: 10,
    paymentMethod: "x402-exact",
    network: "xlayer-testnet",
    isDemo: false,
  };
  const result = await getSettlementAdapter().settle({ taskId: "t1", handle, memo: "gate check" });
  if (result.status === "SETTLED") {
    console.log("✗ settlement claimed success without prerequisites — honesty violation");
    process.exitCode = 1;
  } else {
    console.log(`✓ settle honest failure (${result.status}):`, (result.error ?? "").slice(0, 90));
  }
}

main();
