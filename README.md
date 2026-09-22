# AgentAura — a company OS for the agent economy

> **Give it a mission. It builds the team, spots what it can't do, buys the missing
> capability from another agent on OKX.AI, verifies the work, and pays for it.**
>
> Built for the **OKX AI Hackathon** · 16-bit pixel-art UI · runs 100% free

<p align="center">
  <img src="docs/screenshots/home.png" width="900" alt="AgentAura home — command center with the live agent graph and activity feed" />
</p>

<img src="https://img.shields.io/badge/OKX.AI-ASP%20marketplace-1d2b26" alt="">&nbsp;<img src="https://img.shields.io/badge/Payments-x402%20v2-b58430" alt="">&nbsp;<img src="https://img.shields.io/badge/Network-X%20Layer%20testnet-2e7d4f" alt="">&nbsp;<img src="https://img.shields.io/badge/Next.js-15-black" alt="">&nbsp;<img src="https://img.shields.io/badge/cost-%240-3e8e83" alt="">

---

## Table of contents

1. [The problem](#1-the-problem)
2. [The solution](#2-the-solution)
3. [The 60-second demo](#3-the-60-second-demo)
4. [Screenshots](#4-screenshots)
5. [How OKX AI is used](#5-how-okx-ai-is-used)
6. [Architecture](#6-architecture)
7. [The agent loop, step by step](#7-the-agent-loop-step-by-step)
8. [Tech stack](#8-tech-stack)
9. [Getting started](#9-getting-started)
10. [Environment variables](#10-environment-variables)
11. [Running on $0](#11-running-on-0)
12. [Judge's demo script](#12-judges-demo-script)
13. [Project structure](#13-project-structure)
14. [API reference](#14-api-reference)
15. [Data model](#15-data-model)
16. [Event contract](#16-event-contract)
17. [Task state machine](#17-task-state-machine)
18. [Live vs simulated — full honesty table](#18-live-vs-simulated--full-honesty-table)
19. [Safety, limits and correctness](#19-safety-limits-and-correctness)
20. [What's next](#20-whats-next)

---

## 1. The problem

AI agents are becoming genuinely capable, but they are **closed systems**. A single
agent can plan, write, and reason — yet the moment a task needs a capability it
doesn't have (real market research, a landing page, a demo video, a translation
into Japanese), it either fails or hallucinates an answer.

Today a founder bridges that gap manually:

- they notice the gap,
- go find a human freelancer or another tool,
- negotiate scope and price,
- chase delivery,
- review the work,
- and pay the invoice.

That's a **procurement process**, and agents can't do it. So "autonomous AI
companies" stall at the first missing capability. The agent economy has a
marketplace with no one shopping in it.

## 2. The solution

**AgentAura is a company operating system where the company can buy what it
can't do — from other agents.**

You describe a company and a mission. AgentAura assembles an internal team
(CEO, Strategy, Research, Marketing, Verification) that plans the mission into a
task graph and executes it. When a step falls outside the team's capability, the
CEO doesn't hallucinate and doesn't stop — it runs a real procurement loop:

```
capability gap  →  discover ASPs on OKX.AI  →  select + explain why
      →  hire (A2A escrow / A2MCP per-call)  →  receive deliverable
      →  verify before paying  →  settle via x402 + Agentic Wallet
      →  write the insight to Company Memory  →  learn for next time
```

Every step is visible in a live activity feed, every state change is persisted,
and everything that is simulated is labelled as simulated.

**Why this is the interesting slice of the agent economy:** it demonstrates
agent-to-agent *commerce* end to end — discovery, price, escrow, verification,
settlement, and reputation — not just agent-to-agent chat.

## 3. The 60-second demo

```
1.  npm install && npm run dev          →  http://localhost:3000
2.  Create a company                   →  "Nimbus Labs", budget $25
3.  Give it a mission                  →  "Launch our product and get first 100 users"
4.  Watch the CEO plan                 →  4 tasks, real LLM-generated objectives
5.  Watch the Research step fail       →  🚨 capability gap detected
6.  Watch it shop                      →  8 providers found → MarketMind Labs selected
7.  Watch it pay                       →  x402 → Agentic Wallet → txHash
8.  Watch it learn                     →  insight written to Company Memory
```

No credentials are required to run any of the above. See
[Running on $0](#11-running-on-0).

## 4. Screenshots

| | |
|---|---|
| **Onboarding** — how it works before you commit | **Create company** — name, goal, budget, autonomy policy |
| ![Onboarding](docs/screenshots/onboarding.png) | ![Create](docs/screenshots/create.png) |
| **Home / command center** — live agent graph + activity feed | **Missions** — every mission and its progress |
| ![Home](docs/screenshots/home.png) | ![Missions](docs/screenshots/missions.png) |
| **Mission detail** — task graph, state machine, deliverables, verification scores | **Agents** — internal roster + externally hired ASPs |
| ![Mission detail](docs/screenshots/mission-detail.png) | ![Agents](docs/screenshots/agents.png) |
| **Marketplace** — OKX.AI ASP offers with explainable ranking | **Company memory** — insights with provenance |
| ![Marketplace](docs/screenshots/marketplace.png) | ![Memory](docs/screenshots/memory.png) |
| **Wallet** — Agentic Wallet, escrow, transaction ledger | **Analytics** — spend, verification pass rate, outsourced share |
| ![Wallet](docs/screenshots/wallet.png) | ![Analytics](docs/screenshots/analytics.png) |
| **Settings** — mode, LLM status, autonomy policy | |
| ![Settings](docs/screenshots/settings.png) | |

Regenerate them against your own running instance:

```bash
npm run dev            # in one terminal
npm run screenshots    # in another — drives local Chrome headless
```

## 5. How OKX AI is used

This is the part that matters most, so it is stated precisely.

### 5.1 The three OKX surfaces used

| OKX capability | How AgentAura uses it | Where in code |
|---|---|---|
| **OKX.AI ASP marketplace** | Discovery + hiring. Agents search for service providers by capability, rank offers, and hire the winner. Handles both service types (below). | `src/lib/okx/demo/marketplace.ts`, `src/lib/engine/orchestrator.ts` (`discoverAndHire`) |
| **Agent Payments Protocol (x402 v2)** | Settlement. Quote → sign authorization → replay with `PAYMENT-SIGNATURE` → receipt with `txHash`. | `src/lib/okx/demo/adapters.ts` (`DemoSettlementAdapter`), `src/lib/okx/live/liveAdapter.ts` |
| **Agentic Wallet (Onchain OS)** | The company treasury. Email login, no seed phrase, key held in a TEE; funds escrow and release. | Wallet model in `src/lib/db/schema.ts`, UI in `src/app/wallet/page.tsx` |

### 5.2 The two service types — and why both are modelled

The OKX.AI marketplace exposes two distinct service types, and they have
different economics. AgentAura deliberately handles both because the difference
is the whole point of agent commerce:

| Type | Pricing | Settlement | Modelled as |
|---|---|---|---|
| **A2A** (agent-to-agent) | Negotiated per task | Funds move to on-chain **escrow**, released on acceptance | `serviceType: "A2A"`, `paymentMethod: "a2a-escrow"`, `escrowed: true` |
| **A2MCP** (agent-to-MCP) | Fixed price **per call** | Settled **instantly** via the Payment SDK | `serviceType: "A2MCP"`, `paymentMethod: "x402-exact"`, `escrowed: false` |

In the demo catalog, `MarketMind Labs` (research) is A2A — escrow-protected, which
is why an expensive, high-stakes deliverable gets a verification gate before
release. `XLayer Analytics` and `Polyglot Agents` are A2MCP — cheap, per-call,
settled immediately, no escrow. The engine branches on this:

```ts
// src/lib/engine/orchestrator.ts
paymentMethod: chosen.serviceType === "A2A" ? "a2a-escrow" : "x402-exact"
```

### 5.3 The x402 payment flow, as implemented

The Agent Payments Protocol (x402 v2) is a `402 Payment Required` handshake. The
flow AgentAura models — and the one the live adapter is written against — is:

```
1. Agent requests a resource from the ASP
2. ASP responds  HTTP 402  +  { x402Version: 2,
                               accepts: { scheme, network, asset, amount, payTo } }
3. Agentic Wallet signs an EIP-3009 transferWithAuthorization
     (nonce, validAfter / validBefore window)
4. Agent replays the request with header:
     PAYMENT-SIGNATURE: base64(payload)
5. ASP returns the resource + { status: "success", payer, txHash, network }
```

**Network: X Layer testnet** (`eip155:1952`) — gas is free test OKB, the asset is
test USD₮0. Nothing real is ever spent.

In the current build this flow is executed by `DemoSettlementAdapter`, which
returns a `txHash` prefixed `0xdemo…` and `isDemo: true`. That flag rides all the
way into the UI (see [§18](#18-live-vs-simulated--full-honesty-table)), so a
simulated transaction is **never** presented as an on-chain one.

### 5.4 Why the private keys and the escrow live behind one interface

All OKX-specific code is confined to `src/lib/okx/`. Nothing outside that folder
may call OKX directly, and the engine only ever talks to three interfaces:

```ts
interface OkxDiscoveryAdapter  { discover(query): Promise<ProviderOffer[]> }
interface OkxTaskAdapter       { createExternalTask(input); awaitExternalTask(handle) }
interface OkxSettlementAdapter { quote(handle); settle(input) }
```

`getDiscoveryAdapter() / getTaskAdapter() / getSettlementAdapter()` return the
**demo** or **live** implementation based on `DEMO_MODE`. This is what makes the
project buildable without credentials, and it's why switching to live OKX is a
config flip rather than a rewrite.

### 5.5 What is real vs. wired-but-not-yet-exercised

Being unambiguous about this, because it's the fairest question a judge can ask:

- ✅ **The procurement loop is real code.** The gap detection, discovery, ranking,
  explainable selection, quoting, verification gate, settlement call, reputation
  event, and memory write are all genuine engine logic against a real database.
- ✅ **The LLM planning is genuinely live.** Mission → task graph is produced by a
  real LLM call (see [§8](#8-tech-stack)), and it degrades to a deterministic
  planner if the provider is down.
- ⚠️ **The OKX* adapters* are simulated.** `DEMO_MODE=true` (the default) returns
  synthetic offers, handles and receipts. The live adapters exist and encode the
  verified doc'd flow, but are **stubs that throw a descriptive error** — they
  require an Onchain OS install and an interactive `onchainos wallet login`
  (email OTP), which cannot be completed without a human.
- ❌ **No real funds have moved.** No mainnet, no real USD₮0, ever.

Everything above is enforced in code, not just promised: demo rows carry
`isDemo: true`, and the UI renders a `◈ simulated` tag on `PAYMENT_*` events.

## 6. Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Browser — 16-bit pixel-art UI (Next.js App Router, React 19)            │
│                                                                          │
│  onboarding · create · home · missions · mission detail · agents ·       │
│  marketplace · memory · analytics · wallet · settings · success           │
│                                                                          │
│  ┌────────────────────┐   ┌──────────────────────┐   ┌────────────────┐  │
│  │ AgentGraph (SVG)   │   │ LiveActivity         │   │ pages poll REST│  │
│  │ derived from real  │   │ SSE subscription      │   │ for reads      │  │
│  │ task/graph state   │   │ + approval actions    │   │                │  │
│  └────────────────────┘   └──────────────────────┘   └────────────────┘  │
└───────────────┬──────────────────────┬────────────────────┬─────────────┘
                │ REST /api/*          │ SSE /events        │
┌───────────────▼──────────────────────▼────────────────────▼─────────────┐
│  Next.js route handlers (Node runtime)                                   │
│  validation (zod) · rate limit · idempotency · bootstrap/migrate/seed    │
└───────────────┬──────────────────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────────────┐
│  AGENT ENGINE  (src/lib/engine/orchestrator.ts)                          │
│                                                                          │
│   CEO orchestration ──► task graph ──► task state machine                │
│        │                                     │                           │
│        │                                     ├─► internal work           │
│        │                                     └─► 🚨 capability gap       │
│        │                                              │                  │
│   ┌────▼─────────┐   ┌──────────────┐   ┌─────────────▼──────────────┐   │
│   │ LLM planner  │   │ Verification │   │  PROCUREMENT SUB-LOOP      │   │
│   │ (fallback:   │   │ Agent        │   │  discover → rank → hire →  │   │
│   │ deterministic│   │ gates every  │   │  quote → settle → verify   │   │
│   │  templates)  │   │ payment      │   │                            │   │
│   └──────────────┘   └──────────────┘   └─────────────┬──────────────┘   │
│                                                        │                 │
│   Company Memory ◄──── reputation ◄────────────────────┘                 │
└──────────────────────────────────────┬───────────────────────────────────┘
                │                      │
┌───────────────▼────────────┐  ┌──────▼───────────────────────────────────┐
│  OKX ADAPTER LAYER         │  │  EVENT BUS + PERSISTENCE                │
│  src/lib/okx/  (isolated)  │  │  in-process pub/sub → SSE               │
│                            │  │  Drizzle ORM → SQLite                   │
│  discovery · task · settle │  │  task_events append-only audit trail    │
│  demo ⇄ live by DEMO_MODE  │  │                                         │
└────────────────────────────┘  └──────────────────────────────────────────┘
                │
        ┌───────▼──────────────────────────────────────────────┐
        │  X Layer testnet (eip155:1952) · test USD₮0 · test OKB │
        └──────────────────────────────────────────────────────┘
```

**Four principles held throughout:**

1. **The OKX boundary is a single folder.** Swappable, testable, and honest.
2. **Nothing is decorative.** The agent graph, activity feed, wallet balance,
   analytics and memory are all derived from persisted rows — never hardcoded.
3. **Verification precedes payment.** Settlement only happens after the
   Verification Agent scores the deliverable.
4. **Simulated is labelled.** `isDemo` flags and `◈ simulated` tags everywhere.

## 7. The agent loop, step by step

| # | Stage | What happens | Events emitted |
|---|---|---|---|
| 1 | **Plan** | CEO decomposes the mission into role-tagged tasks with objectives and per-step budgets (LLM, clamped server-side) | `TASK_CREATED`, `TASK_ASSIGNED` |
| 2 | **Execute** | Each task advances through the state machine; internal work produces a role-appropriate artifact | `TASK_STARTED`, `VERIFICATION_PASSED` |
| 3 | **Detect gap** | A task whose capability exceeds the internal team triggers the procurement path | `CAPABILITY_GAP_DETECTED` |
| 4 | **Discover** | Agents query the OKX.AI marketplace for providers matching the capability, within budget | `SERVICE_DISCOVERY_STARTED`, `SERVICE_DISCOVERY_COMPLETED` |
| 5 | **Select** | Offers are ranked by capability fit, reputation and success rate; the winner is chosen **with stated reasons** | `PROVIDER_SELECTED` |
| 6 | **Approve** *(maybe)* | Under `ASK_BEFORE_HIRING`, the loop **blocks** until the founder approves — the agent genuinely waits | `HIRING_APPROVAL_REQUESTED` |
| 7 | **Hire** | An external task is published to the ASP (A2A = negotiated + escrow, A2MCP = fixed per-call) | `EXTERNAL_TASK_CREATED` |
| 8 | **Quote → pay** | The ASP quotes; the Agentic Wallet signs the x402 authorization | `PAYMENT_QUOTED`, `PAYMENT_STARTED` |
| 9 | **Deliver** | The ASP returns the deliverable; the task moves to `DELIVERED` | `EXTERNAL_TASK_DELIVERED` |
| 10 | **Verify** | The Verification Agent scores coverage + evidence quality. Fail ⇒ rework, not blind payment | `VERIFICATION_STARTED`, `VERIFICATION_PASSED` / `VERIFICATION_FAILED` |
| 11 | **Settle** | Funds release from escrow (or settle per call); a transaction row and `txHash` are recorded | `PAYMENT_SETTLED` |
| 12 | **Learn** | A reputation event is recounted and a provenance-tagged insight is written to Company Memory | `REPUTATION_UPDATED`, `MEMORY_CREATED` |
| 13 | **Complete** | Mission progress recalculates and the mission closes | `MISSION_COMPLETED` |

### Explainable selection

The selection isn't a black box — it produces reasons the UI shows the founder:

```jsonc
// PROVIDER_SELECTED payload
{
  "providerName": "MarketMind Labs",
  "taskFit": 85,
  "reasons": [
    "capability match: research, competitors, market-sizing",
    "reputation 4.7★ across 1,284 tasks",
    "99% delivery success rate",
    "A2A: escrow-protected delivery"
  ]
}
```

### Learning that actually changes behaviour

Company Memory isn't a log viewer. Every verified delivery writes an insight with
provenance (which provider, which task, what verification score). Future
discovery and planning read it back, so a provider that delivered well is
preferred and one that needed rework is discounted.

## 8. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Server route handlers + React client in one deployable; SSE and streaming work natively |
| Language | **TypeScript** (strict) | The engine is a state machine over money — types are load-bearing |
| UI | **React 19** + **Tailwind CSS 3** | Pixel-art design system via custom tokens + CSS/SVG scenery; no heavy UI kit |
| Fonts | **Press Start 2P** (`next/font`) | Self-hosted, no layout shift, no external request |
| Database | **SQLite** via **better-sqlite3** | Zero-setup, file-based, perfect for a demo; the whole DB is one file |
| ORM | **Drizzle** | Typed schema + queries, SQL-first, no runtime magic |
| Validation | **zod** | Every write endpoint validates its body |
| Realtime | **Server-Sent Events** | One-way push is all we need; no websocket server, survives the Next runtime |
| Realtime UX | **Polling** for graph + hire-approvals | Cheap, honest, resilient — the graph needs "what changed", not a stream |
| LLM | **Any OpenAI-compatible provider** | OpenRouter / Groq / Gemini / Cerebras / Mistral… see [§11](#11-running-on-0) |
| Payments | **OKX x402 v2** + **Agentic Wallet** | The hackathon's core requirement |
| Marketplace | **OKX.AI ASP services** (A2A / A2MCP) | The agent-to-agent supply side |

**Why SQLite, not Postgres:** the demo must run on a judge's laptop with
`npm install && npm run dev`. A file DB with zero services achieves that. The
Drizzle schema is portable — swapping the driver is a one-file change.

**Why SSE, not websockets:** the event flow is strictly server → viewer. SSE is
a plain HTTP response, so it needs no extra server, works through the Next route
handler, and degrades to "no live updates" rather than a broken page.

### 8.1 Visual design system

Classic 16-bit pixel art applied to a functional web UI: the pixel layer is the
identity, not an excuse to turn the product into a game (spec §6).

**Palette** — sampled directly from the supplied reference screenshot:

| Token | Hex | Role |
|---|---|---|
| `chrome` | `#0f1b22` | Thin top status bar |
| `forest` / `forest-2` | `#012e3c` / `#01222e` | Navigation rail, canvas, panels |
| `cream` / `parchment` | `#faf2e2` / `#f2e9d6` | Main content surfaces |
| `leaf` | `#007755` | Primary action, active, verified |
| `sky` | `#88ccff` | Soft atmospheric secondary |
| **`steel`** | **`#486078`** | **Filled meters, pills and buttons** — the reference's dominant blue (1.28% of its pixels). `steel-deep #304860`, `steel-soft #607890`, and a `sky-deep…sky-pale` ramp (`#60a8f0` → `#a8d8f0`) |
| `gold` | `#d9a441` | Important / financial state |
| `teal` | `#2f6b7d` | Muted teal secondary |
| `wood` | `#512c14` | Pixel signboard labels |
| `plum` | `#7c5cad` | Restrained secondary accent |
| `danger` | `#b23a30` | Failure / destructive only |

**Composition** — a slim 64px icon rail, a 36px top status bar, and content as
chunky cream cards with dark header bars on the dark teal-blue canvas. All of
that chrome lives in `AppShell`, mounted once in `app/layout.tsx`.

From `lg` (1024px) the dashboard is a **three-column grid filling exactly one
viewport** — no tall hero band and no page scroll, matching the reference, whose
three cream columns run from the very top to the very bottom of the frame. The
reference also leaves unusually **wide dark gutters (~60px)** between columns,
reproduced here (56px); at 1111px the measured geometry is rail 64 / column 301 /
gutter 56 against the reference's 61 / 308 / 60. Content is deliberately **dense**:
hairline `.pixel-row`s and **blue-filled `.pixel-meter`s** carry most of the
meaning, because the reference's cards are full of filled blue bars.

> **How this was matched without being able to see images.** Summary statistics
> (colour histograms, light/dark ratios) can agree on palette while missing the
> composition entirely — which is exactly what happened on the first pass. The
> reliable instrument turned out to be a **coarse ASCII block map**: downsample
> both images to a 100×34 grid, classify each cell by hue and luminance into one
> character, and print it as text. That is readable as plain text, and it is what
> exposed the missing full-viewport composition and the missing chrome. See
> `PROJECT_PROGRESS.md` §3.8.

**Iconography** — no emoji and no humans. Every icon and every agent avatar is an
8×8 **pixel sprite** drawn as crisp SVG rects (`src/components/PixelSprite.tsx`):
robots for agents, shields for verification, magnifiers for research, globes for
external ASPs. Agent sprites are chosen by *role*, so an agent always looks the
same everywhere it appears.

**Environment** — pure SVG pixel scenery, on the spec's natural-scenery brief
(forests, mountains, lakes, cliffs, waterfalls, flowers, ruins, distant scenery —
serene and calm; no neon, no floating islands, no medieval village, no humans).
Seven scenes share a layered system of sky gradient, sun, clouds, birds, distant
ranges, treelines, water reflections, waterfall mist, stone ruins and wildflowers:

| Page | Scene | | Page | Scene |
|---|---|---|---|---|
| Home | lake (in-card strip) | | Marketplace | cliff |
| Onboarding | mountain | | Memory | ruins (archives) |
| Create · Analytics · Settings | meadow | | Wallet | waterfall (flows of value) |
| Missions | mountain | | Agents | lake |
| Mission detail | forest | | Success | mountain |

Scenes are chosen semantically rather than decoratively — Memory is *ruins*, the
Wallet is a *waterfall*. An `AmbientScenery` layer (transparent-sky distant range
and treeline) also sits behind all page content at 22% opacity, so the environment
is felt in the canvas itself. That implements the spec's split: **70–80%
functional UI, 20–30% environmental identity**. Interactive UI stays real HTML/CSS;
no pixel filter is applied to the site.

## 9. Getting started

**Requirements:** Node 20+ and npm. That's it — no Docker, no database server,
no API keys needed to see the full loop.

```bash
git clone https://github.com/khushi-infinity/AgentAura.git
cd AgentAura
npm install
cp .env.example .env.local     # optional — leave blank to run in demo mode
npm run dev
```

Open **http://localhost:3000**.

On first request the app **migrates and seeds itself** — there is no separate
setup step, no login, and no API key needed. You'll land on a demo company
already populated with agents, a completed mission, memory, marketplace offers
and a funded wallet.

If port 3000 is already taken by another process, pass your own:
`npm run dev -- -p 3100`.

### Other commands

```bash
npm run dev           # dev server on http://localhost:3000 (hot reload)
npm run build         # production build into .next (also type-checks)
npm start             # build, then serve production on http://localhost:3000
npm run typecheck     # tsc --noEmit
npm run db:seed       # re-run the demo seed
npm run db:reset      # delete the SQLite file (next request re-seeds)
npm run screenshots   # regenerate docs/screenshots from a running server
```

**Seeing it run.** `npm run dev` and open <http://localhost:3000> — the first
request creates and seeds the database, so there is nothing to initialise first.
There is no login and no key requirement.

`npm start` builds before serving, so it works from a clean checkout without you
having to remember to build. Note that it writes the same `.next` directory the
dev server uses, so stop the dev server before running it (otherwise the build
replaces the dev server's artifacts underneath it).

> **Note on resetting the DB:** stop the dev server before `npm run db:reset`.
> Deleting the SQLite file underneath a running process leaves the old handle
> open, and you'll see stale data. (This bit us during development.)

### Switching to a live OKX flow

```bash
# 1. Install the Onchain OS skill/CLI
npx -y @okxweb3/onchainos-installer install

# 2. Log in the Agentic Wallet (interactive — email OTP, must be done by a human)
onchainos wallet login

# 3. Fund it from the X Layer testnet faucet: test OKB (gas) + test USD₮0

# 4. Flip the switch
DEMO_MODE=false   # in .env.local
```

The live adapters currently throw a descriptive `not yet wired` error naming the
missing step, so you get a clear failure instead of a silent wrong answer.

## 10. Environment variables

Copy `.env.example` → `.env.local`. **Every variable is optional.**

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | *(empty)* | Key for your OpenAI-compatible provider. **Blank ⇒ deterministic planner.** |
| `OPENAI_BASE_URL` | OpenAI | Provider endpoint (Groq, Gemini, OpenRouter, Cerebras, Mistral…) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model id. The first choice; failover models are tried if it 503s |
| `DEMO_MODE` | `true` | `true` = simulated OKX flow (honestly labelled). `false` = live adapters |
| `ONCHAINOS_NETWORK` | `xlayer-testnet` | Settlement network |
| `XLAYER_TESTNET_RPC` | *(empty)* | Optional explicit RPC |
| `RESEARCH_API_KEY` | *(empty)* | Optional Tavily/Serper/Exa key for live research. **Not required.** |

`.env.local` is gitignored. Only `.env.example` (names, no values) is committed.

## 11. Running on $0

Every dependency has a free path, and none of them are hard requirements — with
**no keys at all** the full loop still runs deterministically.

| Concern | Free option |
|---|---|
| **LLM** | ⭐ **Groq** (fast, no card) · Google AI Studio/Gemini · OpenRouter `:free` models · Cerebras · Mistral. Or nothing at all. |
| **Database** | SQLite — already free, one file, zero setup |
| **Payments** | X Layer **testnet** — faucet test OKB (gas) + test USD₮0 |
| **Agentic Wallet / OKX.AI** | Free, email login, no seed phrase |
| **Search API** | Optional. The engine works without one. |
| **Hosting** | Any Node host, or run locally |

See [`docs/FREE_TIER.md`](docs/FREE_TIER.md) for provider-by-provider setup.

### Free-model resilience

Free LLM tiers are flaky — they return `503` under load, and some reject
`response_format: json_object`. The adapter is built for that reality:

- **No `response_format` dependency** — it asks for JSON in the prompt.
- **Tolerant parsing** — strips markdown fences and surrounding prose, then
  falls back to the first balanced `{…}` / `[…]` block.
- **Retry + failover** — 2 attempts per model across a verified list of working
  `:free` models, with a **sticky winner** remembered per process.
- **Graceful degradation** — if every model fails, planning falls back to
  deterministic templates and *the demo never breaks*.

This is not theoretical: during development the first-choice model returned
`503` mid-demo and the adapter silently failed over to a working model while the
mission completed normally.

## 12. Judge's demo script

A ~3 minute path through the whole thesis. Everything below is reachable from
the UI; no terminal required.

```
[0:00] ONBOARDING → CREATE
       Create "Nimbus Labs", goal "Launch our product and get first 100 users",
       budget $25, policy "Auto hire below budget".
       → 5 agents assembled, wallet funded with $25.

[0:20] HOME → mission card goes ACTIVE
       Watch Live Activity: the CEO plans the mission into a task graph.
       Point out: these objectives are LLM-generated, not templates.

[0:45] MISSION DETAIL → the task graph
       Four tasks. Strategy, Product and Marketing complete internally.
       The Research task is different.

[1:00] 🚨 THE GAP MOMENT
       "Capability gap detected" → "Searching OKX.AI marketplace for providers"
       → "8 providers found". This is the pivot from a closed agent to a company
       that can buy capability.

[1:20] EXPLAINABLE SELECTION
       "Selected MarketMind Labs" — open the Marketplace page to show the ranked
       offers and the stated reasons (capability fit, 4.7★, 99% success rate,
       A2A escrow).

[1:45] PAYMENT
       Quote → Agentic Wallet → x402 → "Payment settled — 0.50 USD₮0" with a
       txHash. Note the ◈ simulated tag: in demo mode this is honestly labelled.
       Open WALLET: $24.50 available, escrow, and an OUT transaction ledger.

[2:10] VERIFICATION BEFORE PAYMENT
       The Verification Agent scored the deliverable 100/100 before anything was
       paid. Show the deliverable text and its score on Mission Detail.

[2:30] MEMORY + REPUTATION
       "Insight stored in Company Memory" / "Reputation event for MarketMind Labs".
       Open MEMORY: the insight carries provenance (which provider, which task,
       what score). Open ANALYTICS: spend, verification pass rate, outsourced share.

[2:50] THE CONTRAST
       Set the policy to "Ask before hiring" and run another mission. The loop
       BLOCKS and asks for approval in Live Activity — agents wait for a human.
       That's the autonomy dial the whole thesis hangs on.
```

**The one-line summary for judges:** *closed agents hit a wall at the first
missing capability; AgentAura turns that wall into a purchase order.*

## 13. Project structure

```
AgentAura/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home / command center
│   │   ├── onboarding/ create/         # landing → company creation
│   │   ├── missions/ missions/[id]/    # list + task graph & state machine
│   │   ├── agents/ marketplace/        # roster + OKX.AI ASP offers
│   │   ├── memory/ analytics/          # knowledge + metrics
│   │   ├── wallet/ settings/ success/
│   │   ├── error.tsx                   # global error boundary
│   │   └── api/                        # 15 route handlers (see §14)
│   ├── components/
│   │   ├── ui.tsx                      # pixel design system primitives
│   │   ├── AppShell.tsx                # nav, hero, pixel scenery
│   │   ├── AgentGraph.tsx              # living graph from real state
│   │   └── LiveActivity.tsx            # SSE feed + hire approvals
│   └── lib/
│       ├── engine/orchestrator.ts      # CEO + state machine + procurement
│       ├── agents/gap.ts               # capability-gap detection rules
│       ├── agents/hire.ts              # provider ranking + reasons
│       ├── llm/provider.ts             # OpenAI-compatible adapter + failover
│       ├── events/bus.ts, service.ts   # pub/sub + persistence + progress
│       ├── okx/                        # ← ALL OKX CODE LIVES HERE
│       │   ├── types.ts  config.ts  index.ts
│       │   ├── demo/marketplace.ts     # ASP catalog
│       │   ├── demo/adapters.ts        # simulated discovery/task/settlement
│       │   ├── live/liveAdapter.ts     # documented live path
│       │   └── README.md
│       ├── db/                         # schema, connection, migrate, seed
│       ├── security.ts                 # rate limit + idempotency
│       ├── injection.ts                # prompt-injection scrub + envelope
│       └── types.ts
├── docs/
│   ├── FREE_TIER.md                    # the $0 setup guide
│   └── screenshots/                    # 11 captured pages
├── scripts/screenshots.mjs             # README screenshot automation
├── PROJECT_PROGRESS.md                 # build log, decisions, what's left
└── AGENTS.md                           # orientation for AI contributors
```

## 14. API reference

All handlers validate input with zod, are rate-limited per client key, and
migrate/seed on first call via `bootstrap()`.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/companies` | Current company + missions + live agent/hired-ASP counts |
| `POST` | `/api/companies` | Create a company: roster of 5 agents, treasury wallet, draft mission |
| `GET` | `/api/companies/:id` | Company detail |
| `POST` | `/api/companies/:id/goals/execute` | Create/launch a mission; runs the CEO loop in the background (idempotent) |
| `GET` | `/api/companies/:id/graph` | Graph nodes/edges for the UI, derived from real agents + task rows |
| `GET` | `/api/companies/:id/events` | **SSE** — replays last 60 events, then streams live ones |
| `GET` | `/api/missions` | Mission list |
| `GET` | `/api/missions/:id` | Mission + tasks + deliverables |
| `GET` | `/api/tasks/:id` | Task detail |
| `POST` | `/api/tasks/:id/verify` | Human verification override |
| `GET` | `/api/agents` | Internal roster + externally hired ASPs |
| `GET` | `/api/marketplace/discover` | Discovery against the OKX.AI adapter layer |
| `GET`/`POST` | `/api/hire-requests` | Pending hire approvals / approve or decline |
| `GET` | `/api/memory` | Company Memory entries |
| `GET` | `/api/wallet` | Treasury, escrow, transaction ledger |
| `GET` | `/api/config` | Client-safe runtime config (mode, LLM status) |

**Error semantics:** `400` invalid body · `404` not found · `409` duplicate
request (idempotency) · `429` rate limited.

## 15. Data model

SQLite via Drizzle (`src/lib/db/schema.ts`):

```
companies ─┬─ agents            (internal roster + hired ASPs)
           ├─ wallets ── transactions
           ├─ missions ─┬─ tasks ─┬─ deliverables
           │            │         └─ task_events      (append-only audit trail)
           │            └─ payments
           ├─ memory_items      (provenance-tagged insights)
           └─ hire_requests     (pending founder approvals)
```

Notable columns: `is_demo` (honesty flag on demo rows), `is_outsourced` +
`external_provider_id` + `external_task_ref` (the external hire), `escrowed`,
`payment_method`, `tx_hash`, `receipt`, `verification_score`, `verification_notes`,
`spend_cents` on both tasks and missions.

**Derived, never hardcoded:** mission progress and spend are summed from task
rows; the home "External Agents" count is the distinct set of *actually hired*
providers; the wallet balance is read live. (The initial build hardcoded three of
these — they were found and fixed during the judge-style audit in
[`PROJECT_PROGRESS.md`](PROJECT_PROGRESS.md).)

## 16. Event contract

18 event types, all persisted to `task_events` and streamed over SSE. This is the
contract the UI renders — the feed is a projection of the audit trail, not a
separate narrative.

`TASK_CREATED` · `TASK_ASSIGNED` · `TASK_STARTED` · `CAPABILITY_GAP_DETECTED` ·
`SERVICE_DISCOVERY_STARTED` · `SERVICE_DISCOVERY_COMPLETED` · `PROVIDER_SELECTED` ·
`HIRING_APPROVAL_REQUESTED` · `EXTERNAL_TASK_CREATED` · `PAYMENT_QUOTED` ·
`PAYMENT_STARTED` · `EXTERNAL_TASK_DELIVERED` · `VERIFICATION_STARTED` ·
`VERIFICATION_PASSED` · `VERIFICATION_FAILED` · `PAYMENT_SETTLED` ·
`MEMORY_CREATED` · `REPUTATION_UPDATED` · `MISSION_COMPLETED`

Each carries `id, companyId, missionId, taskId, type, actorName, title, detail,
payload, createdAt`. Payment events carry `{ txHash, isDemo }` so the UI can label
simulated settlements.

## 17. Task state machine

```
PLANNED → ASSIGNED → EXECUTING → ┬─► DELIVERED → VERIFYING → VERIFIED → PAID → COMPLETED
                                 │                      └─► REJECTED → REWORK_REQUIRED ─┐
                                 └─► OUTSOURCING → AWAITING_PROVIDER ──────────────────┘
                                                                          │
                                                                     PAYMENT_FAILED
```

`REWORK_REQUIRED` retries once with a reduced-confidence memory note rather than
dead-ending, so the primary demo flow is always replayable.

## 18. Live vs simulated — full honesty table

| Capability | Status | Evidence |
|---|---|---|
| CEO mission planning | ✅ **Live LLM** (deterministic fallback) | Real objectives in Live Activity, e.g. *"Run targeted acquisition campaigns to attract the first 100 users"* |
| Task graph + state machine | ✅ **Real** | `task_events` rows, 11-state machine |
| Capability-gap detection | ✅ **Real** | `src/lib/agents/gap.ts`, word-bounded rules |
| ASP discovery + ranking | ⚠️ **Simulated** (catalog), real algorithm | `demoOffers()` scores capability fit, reputation, success rate |
| Explainable selection reasons | ✅ **Real** | `PROVIDER_SELECTED` payload |
| Hire approval (human-in-the-loop) | ✅ **Real** — the loop blocks | `hire_requests`, Approve/Decline in Live Activity |
| Payment protocol shape (x402 v2, EIP-3009, `PAYMENT-SIGNATURE`) | ✅ **Real code path**, simulated transport | `DemoSettlementAdapter` |
| Settlement + `txHash` | ⚠️ **Simulated** — `0xdemo…`, `isDemo: true`, `◈ simulated` in UI | Never claims on-chain |
| X Layer testnet (`eip155:1952`) | ⚠️ **Configured, not transacted** | Constant in `okx/types.ts` |
| Agentic Wallet | ⚠️ **Modelled + UI**, login requires a human | Requires interactive email OTP |
| Verification gate before payment | ✅ **Real** | Score + notes gate the settle call |
| Company Memory + provenance | ✅ **Real** | `memory_items` with provider/task/score |
| Reputation events | ✅ **Real** | `REPUTATION_UPDATED` on verified delivery |

**Rule the codebase follows:** if something is simulated, the UI says so. There is
no path where a demo transaction is presented as a real one.

## 19. Safety, limits and correctness

**Input hardening**
- **zod validation** on every write endpoint; unknown fields are dropped.
- **Rate limiting** per client key on expensive routes (`POST /companies`,
  `goals/execute`) → `429`.
- **Idempotency keys** so a double-click can't run the mission loop twice → `409`.
- **Prompt-injection scrubbing**: third-party deliverable content is sanitised and
  wrapped in an explicit envelope before it can enter agent context, so a
  malicious ASP can't smuggle instructions into the CEO's reasoning.
- **Server-side budget clamping**: LLM-proposed per-step budgets are clamped
  (the planner once proposed $1000 for a $25 mission).
- **Error boundary** (`app/error.tsx`) so a failed render is recoverable, not white.
- **Secrets**: `.env.local` only, gitignored; no keys in source or in the bundle.

**Known limits (stated, not hidden)**
- The engine is **in-process**: a background mission runs in the dev server's
  Node process. A restart mid-mission leaves that mission paused. A durable queue
  is the first thing to add for production.
- SQLite is **single-writer**; concurrent missions serialise.
- SSE carries state *changes*; the UI re-fetches on load, so a dropped stream
  degrades to slightly stale, never broken.
- No auth yet — it's a single-tenant demo. Multi-tenant needs sessions + row scoping.

## 20. What's next

**Near term**
1. **Wire the live OKX flow** — the one blocker is an interactive Agentic Wallet
   login plus faucet funds; the adapters are written and waiting.
2. **Durable mission execution** — move the loop to a queue/worker so restarts
   resume instead of pause.
3. **A2MCP direct calls** — invoke per-call ASP services without a task wrapper.

**Bigger bets**
4. **Agent revenue, not just spend** — let a company *list* its own capabilities
   as an ASP, so it earns USD₮0 from other agent companies. This closes the loop
   into a two-sided agent economy.
5. **Reputation as portable, on-chain state** — make delivery quality a real
   transferable signal so ASPs can't fake trust by re-registering.
6. **Negotiation** — currently the ASP quotes and the agent accepts; multi-round
   price/scope negotiation is where A2A gets genuinely interesting.
7. **Verification depth** — move beyond coverage+evidence heuristics to
   independent re-derivation of key claims.

---

## Credits

Built for the **OKX AI Hackathon** by **Khushi Sarawagi**
([@khushi-infinity](https://github.com/khushi-infinity)).

OKX integration follows the official Onchain OS documentation
(`web3.okx.com/onchainos/dev-docs`) — ASP marketplace, the Agent Payments
Protocol (x402), and the Agentic Wallet. No OKX endpoint in this repository is
invented; where the docs were needed, they are cited inline in
`src/lib/okx/README.md` and `src/lib/okx/live/liveAdapter.ts`.
