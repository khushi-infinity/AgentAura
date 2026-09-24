import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

// OnchainOS CLI bridge (the documented human/agent interface —
// web3.okx.com/onchainos/dev-docs). The Agentic Wallet's key lives inside a
// TEE; nothing in this process ever sees a private key. All signing goes
// through the CLI, which owns the wallet session created by
// `onchainos wallet login`.

export const ONCHAINOS_BIN = process.env.ONCHAINOS_BIN ?? "onchainos";

export class OnchainosError extends Error {
  constructor(
    message: string,
    readonly missingStep: "install" | "login" | "unknown",
  ) {
    super(message);
    this.name = "OnchainosError";
  }
}

async function run(args: string[], timeoutMs = 30_000): Promise<string> {
  try {
    const { stdout } = await exec(ONCHAINOS_BIN, args, { timeout: timeoutMs });
    return stdout;
  } catch (err) {
    const e = err as { code?: string | number; message?: string; killed?: boolean };
    if (e.code === "ENOENT") {
      throw new OnchainosError(
        "OnchainOS CLI not found. Install it with: npx -y @okxweb3/onchainos-installer install",
        "install",
      );
    }
    if (e.killed) {
      throw new OnchainosError(`onchainos ${args[0]} timed out`, "unknown");
    }
    const msg = e.message ?? String(err);
    // The CLI's own wording for "no wallet session" — surface it as the
    // recoverable "do the login step" case, not a hard failure.
    if (/not (logged in|authenticated)|login required|no wallet|unauthorized/i.test(msg)) {
      throw new OnchainosError(
        "Agentic Wallet not logged in. Run: onchainos wallet login",
        "login",
      );
    }
    throw new OnchainosError(`onchainos ${args[0]} failed: ${msg.slice(0, 300)}`, "unknown");
  }
}

/** Parse a JSON object out of CLI output, tolerating surrounding log noise. */
function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface WalletInfo {
  address: string;
  network: string;
}

export async function walletStatus(): Promise<WalletInfo | null> {
  const out = await run(["wallet", "status", "--json"]).catch((err: OnchainosError) => {
    if (err.missingStep === "login") return "";
    throw err;
  });
  if (!out.trim()) return null;
  const json = extractJson(out);
  const address = (json?.address as string) ?? (/0x[a-fA-F0-9]{40}/.exec(out)?.[0] ?? null);
  if (!address) return null;
  return { address, network: (json?.network as string) ?? "eip155:1952" };
}

/**
 * Sign an EIP-3009 authorization for an x402 "exact" payment via the
 * Agentic Wallet. `requirements` is the PaymentRequirements object taken
 * verbatim from the seller's 402 response (`accepts[i]`).
 */
export async function signX402Authorization(params: {
  requirements: {
    scheme: string;
    network: string;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds?: number;
    extra?: Record<string, unknown>;
  };
  resourceUrl: string;
}): Promise<{
  payload: { signature: string; authorization: Record<string, string> };
}> {
  const out = await run(
    [
      "wallet",
      "sign",
      "--json",
      "--scheme", params.requirements.scheme,
      "--network", params.requirements.network,
      "--asset", params.requirements.asset,
      "--amount", params.requirements.amount,
      "--pay-to", params.requirements.payTo,
      "--resource", params.resourceUrl,
    ],
    60_000,
  );
  const json = extractJson(out);
  const payload = json?.payload as { signature?: string; authorization?: Record<string, string> } | undefined;
  if (!payload?.signature || !payload.authorization) {
    throw new OnchainosError(
      `Could not parse wallet signature output: ${out.slice(0, 200)}`,
      "unknown",
    );
  }
  return { payload: payload as { signature: string; authorization: Record<string, string> } };
}
