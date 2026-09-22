import "server-only";

// ── Rate limiting (spec §19: "Rate-limit public endpoints") ──────────
// Fixed-window in-memory limiter. Sufficient for hackathon scope; swap
// for a Redis-backed token bucket before real production use.

interface Bucket {
  count: number;
  windowStart: number;
}

const globalForRl = globalThis as unknown as {
  __agentaura_rl?: Map<string, Bucket>;
};
const buckets: Map<string, Bucket> = (globalForRl.__agentaura_rl ??= new Map());

/**
 * Returns true if allowed, false when rate-limited.
 * Default: 20 requests per 60s per key (client IP + route).
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function clientKey(req: Request, route: string): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  return `${route}:${ip}`;
}

/** Standard 429 response. */
export function tooMany() {
  return Response.json({ error: "rate_limited" }, { status: 429 });
}

// ── Idempotency (spec §19: "Use idempotency for external tasks and payments") ──
// Goal-execute calls are the only externally-visible mutations (mission
// kickoff). Deduplicate by (companyId, missionId) within 5 minutes so a
// double-click cannot double-run the orchestration loop.

interface Inflight {
  key: string;
  at: number;
}

const globalForIdem = globalThis as unknown as {
  __agentaura_idem?: Map<string, Inflight>;
};
const inflight: Map<string, Inflight> = (globalForIdem.__agentaura_idem ??= new Map());

const IDEM_WINDOW = 5 * 60_000;

export function checkAndSetIdempotency(key: string): boolean {
  const now = Date.now();
  const existing = inflight.get(key);
  if (existing && now - existing.at < IDEM_WINDOW) return false; // duplicate
  // Opportunistic cleanup.
  for (const [k, v] of inflight) {
    if (now - v.at > IDEM_WINDOW) inflight.delete(k);
  }
  inflight.set(key, { key, at: now });
  return true;
}
