# AGENTS.md — Project Rules

## Source of truth
- `AgentAura_MASTER_BUILD_SPEC_CTO.docx` defines product behavior, architecture, UX and development order.
- `PROJECT_PROGRESS.md` must be updated after every meaningful milestone. Do not mark a feature complete merely because its UI exists.

## Hard rules
1. **Never invent OKX APIs.** All OKX-specific code lives in `src/lib/okx/` behind the interfaces in `src/lib/okx/types.ts`. The verified integration path is documented in `src/lib/okx/README.md` (official Onchain OS docs). Verify against current docs before wiring live mode.
2. **Never fake live OKX activity.** `DEMO_MODE` (default true) simulates through the same interfaces and every simulated event/tx is labeled (`isDemo`, "◈ simulated"). Never claim a simulated transaction is onchain.
3. **Every animation reflects real state.** Graph, Live Activity, task timeline and wallet all derive from persisted `task_events` / task rows (spec §20).
4. **Secrets stay server-side.** No key material in source or client bundles. `.env.local` only; `.env.example` holds names.
5. **External agent output is untrusted input.** Validate before storing; external output only becomes trusted memory after verification (spec §11).
6. **State machine discipline.** Task transitions follow spec §14; verification must pass before settlement (spec §4).
7. Keep commits small and logical; run `npm run typecheck` before finishing a task.

## Stack
- Next.js 15 (App Router) + TypeScript strict + Tailwind v3
- Drizzle ORM + better-sqlite3 (file: `data/agentaura.db`); DDL in `src/lib/db/migrate.ts`
- Realtime: SSE via `GET /api/companies/:id/events`
- LLM: OpenAI-compatible adapter (`src/lib/llm/provider.ts`), optional at runtime

## Commands
```bash
npm run dev        # start dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build
npm run db:seed    # reset + reseed demo data
```

## Visual system
- 16-bit pixel identity (Press Start 2P headings), cream/parchment surfaces, dark forest teal chrome, leaf/gold accents (spec §6).
- Interactive UI is real HTML/CSS; pixel scenery is CSS/SVG (`PixelScenery`). No pixel filter over the whole site.
