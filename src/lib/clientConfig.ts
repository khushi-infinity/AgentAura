let cached: boolean | null = null;

// Client-safe DEMO_MODE flag (spec §18: simulated events must be labeled).
// Defaults to true until /api/config says otherwise; no secrets involved.
export async function fetchDemoMode(): Promise<boolean> {
  if (cached !== null) return cached;
  try {
    const res = await fetch("/api/config");
    const data = (await res.json()) as { demoMode?: boolean };
    cached = data.demoMode ?? true;
  } catch {
    cached = true;
  }
  return cached;
}

export const isDemoModeClient = true;
