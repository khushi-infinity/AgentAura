// In-process event bus. SSE endpoints subscribe here; the agent engine
// publishes every TaskEvent so all screens derive from real state (spec §20).

export interface LiveEvent {
  id: string;
  companyId: string;
  taskId: string | null;
  missionId: string | null;
  type: string;
  actorId: string | null;
  actorName: string | null;
  title: string;
  detail: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

type Listener = (e: LiveEvent) => void;

const globalForBus = globalThis as unknown as {
  __agentaura_listeners?: Set<Listener>;
};

const listeners: Set<Listener> = (globalForBus.__agentaura_listeners ??= new Set());

export function publish(e: LiveEvent) {
  for (const l of listeners) {
    try {
      l(e);
    } catch {
      // a dead SSE client must never break the engine
    }
  }
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
