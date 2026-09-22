import "server-only";

// DEMO_MODE is the honesty switch (spec §18). When true, every OKX adapter
// below simulates the real flow through the same interfaces and the UI
// labels events as simulated. When false, Live* adapters must be used.
export function isDemoMode(): boolean {
  const v = (process.env.DEMO_MODE ?? "true").toLowerCase();
  return v !== "false" && v !== "0";
}

export function requireLiveConfig(): { ok: boolean; missing: string[] } {
  // Live mode requires the Onchain OS CLI to be installed and the Agentic
  // Wallet to be logged in (`onchainos wallet login`) — those are checked at
  // runtime by the live adapter, not from env vars.
  const missing: string[] = [];
  if (isDemoMode()) return { ok: true, missing };
  return { ok: missing.length === 0, missing };
}
