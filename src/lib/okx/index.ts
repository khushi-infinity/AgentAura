import "server-only";
import { isDemoMode } from "./config";
import { DemoDiscoveryAdapter, DemoSettlementAdapter, DemoTaskAdapter } from "./demo/adapters";
import { LiveDiscoveryAdapter, LiveSettlementAdapter, LiveTaskAdapter } from "./live/liveAdapter";
import type { OkxDiscoveryAdapter, OkxSettlementAdapter, OkxTaskAdapter } from "./types";

// The single place where DEMO_MODE selects adapters. Engine code depends
// only on the interfaces in ./types (spec §16: OKX behind interfaces).

export function getDiscoveryAdapter(): OkxDiscoveryAdapter {
  return isDemoMode() ? new DemoDiscoveryAdapter() : new LiveDiscoveryAdapter();
}

export function getTaskAdapter(): OkxTaskAdapter {
  return isDemoMode() ? new DemoTaskAdapter() : new LiveTaskAdapter();
}

export function getSettlementAdapter(): OkxSettlementAdapter {
  return isDemoMode() ? new DemoSettlementAdapter() : new LiveSettlementAdapter();
}
