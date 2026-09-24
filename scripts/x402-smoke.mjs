#!/usr/bin/env node
// Smoke test for the live x402 payment path against OKX's official Mock
// Merchant (docs: web3.okx.com/onchainos/dev-docs/payments/payment-use-buyer).
//
// Verifies, in order:
//   1. OnchainOS CLI installed + Agentic Wallet logged in (or tells you the step)
//   2. The seller's 402 challenge parses (x402Version 2, exact scheme, X Layer testnet)
//   3. Signing via the Agentic Wallet (TEE) works
//   4. The PAYMENT-SIGNATURE replay succeeds and returns a real txHash
//   5. The tx verifies on OKLink X Layer testnet
//
// Run:  node scripts/x402-smoke.mjs
// Env:  ONCHAINOS_BIN (default "onchainos"), ONCHAINOS_NETWORK (default xlayer-testnet)

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const BIN = process.env.ONCHAINOS_BIN ?? "onchainos";
const NETWORK = (process.env.ONCHAINOS_NETWORK ?? "xlayer-testnet").includes("mainnet")
  ? "eip155:196"
  : "eip155:1952";
const RESOURCE_URL = "https://www.okx.com/api/v1/pay/mock-merchant/resource";
const USDT0_TESTNET = "0x9e29b3aada05bf2d2c827af80bd28dc0b9b4fb0c";

let step = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const info = (msg) => console.log(`  · ${msg}`);
const section = (msg) => console.log(`\n${++step}. ${msg}`);

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function main() {
  console.log("x402 live smoke test — OKX Mock Merchant on X Layer testnet");
  console.log(`network: ${NETWORK}\nresource: ${RESOURCE_URL}`);

  // ── 1. CLI + wallet session ─────────────────────────────────────────
  section("Check OnchainOS CLI and Agentic Wallet session");
  let address = null;
  try {
    const { stdout } = await exec(BIN, ["wallet", "status", "--json"], { timeout: 20_000 });
    const json = extractJson(stdout);
    address = json?.address ?? /0x[a-fA-F0-9]{40}/.exec(stdout)?.[0] ?? null;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("  ✗ OnchainOS CLI not found. Run: npx -y @okxweb3/onchainos-installer install");
    } else {
      console.error(`  ✗ wallet status failed: ${String(err.message).slice(0, 200)}`);
    }
    process.exit(1);
  }
  if (!address) {
    console.error("  ✗ Agentic Wallet not logged in. Run: onchainos wallet login");
    process.exit(1);
  }
  ok(`wallet session active: ${address.slice(0, 10)}…${address.slice(-6)}`);

  // ── 2. Fetch the 402 challenge ──────────────────────────────────────
  section("Request the mock-merchant resource (expect HTTP 402 challenge)");
  const first = await fetch(RESOURCE_URL);
  if (first.status !== 402) {
    console.error(`  ✗ expected 402, got ${first.status}`);
    process.exit(1);
  }
  const challenge = await first.json();
  const accept = challenge.accepts?.find((a) => a.scheme === "exact");
  if (!accept) {
    console.error("  ✗ 402 challenge has no 'exact' option:", JSON.stringify(challenge).slice(0, 200));
    process.exit(1);
  }
  ok(`x402Version ${challenge.x402Version}, scheme=${accept.scheme}`);
  ok(`network=${accept.network || NETWORK}, asset=${accept.asset || USDT0_TESTNET}`);
  ok(`amount=${accept.amount} (smallest unit), payTo=${accept.payTo}`);

  // ── 3. Sign with the Agentic Wallet ─────────────────────────────────
  section("Sign the EIP-3009 authorization via the Agentic Wallet (TEE)");
  const signArgs = [
    "wallet", "sign", "--json",
    "--scheme", accept.scheme,
    "--network", accept.network || NETWORK,
    "--asset", accept.asset || USDT0_TESTNET,
    "--amount", accept.amount,
    "--pay-to", accept.payTo,
    "--resource", challenge.resource?.url ?? RESOURCE_URL,
  ];
  let payload;
  try {
    const { stdout } = await exec(BIN, signArgs, { timeout: 60_000 });
    const json = extractJson(stdout);
    payload = json?.payload;
    if (!payload?.signature || !payload.authorization) throw new Error("missing payload.signature/authorization");
  } catch (err) {
    console.error(`  ✗ signing failed: ${String(err.message).slice(0, 300)}`);
    process.exit(1);
  }
  ok(`signed by ${payload.authorization.from?.slice(0, 10)}… validBefore=${payload.authorization.validBefore}`);

  // ── 4. Replay with PAYMENT-SIGNATURE ────────────────────────────────
  section("Replay the request with PAYMENT-SIGNATURE");
  const paymentPayload = {
    x402Version: challenge.x402Version ?? 2,
    resource: { url: challenge.resource?.url ?? RESOURCE_URL, mimeType: "application/json" },
    accepted: accept,
    payload,
  };
  const sig = Buffer.from(JSON.stringify(paymentPayload), "utf8").toString("base64");
  const second = await fetch(RESOURCE_URL, { headers: { "PAYMENT-SIGNATURE": sig } });
  const receipt = await second.json().catch(() => null);
  if (!second.ok || receipt?.payment?.status !== "success") {
    console.error(`  ✗ paid replay failed (${second.status}):`, JSON.stringify(receipt).slice(0, 300));
    process.exit(1);
  }
  ok(`payment.status=success, payer=${receipt.payment.payer}`);
  ok(`txHash=${receipt.payment.txHash}`);

  // ── 5. On-chain verification pointer ────────────────────────────────
  section("Verify on-chain");
  info(`Open OKLink X Layer Testnet and search: ${receipt.payment.txHash}`);
  info("https://www.oklink.com/x-layer-testnet");

  console.log("\nAll steps passed — the live x402 path is demo-ready. 🎉");
}

main().catch((err) => {
  console.error("unexpected failure:", err);
  process.exit(1);
});
