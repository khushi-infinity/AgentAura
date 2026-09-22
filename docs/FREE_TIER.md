# Running AgentAura 100% Free

Every paid dependency has a free alternative. The app is architected so
none of these are hard requirements: with **no keys at all**, the full demo
loop runs deterministically in `DEMO_MODE` (clearly labeled as simulated).

## 1. LLM — powers the internal agents

The adapter (`src/lib/llm/provider.ts`) speaks the OpenAI-compatible
`/chat/completions` format, so any of these work by setting three env vars
in `.env.local`. All options below are free, require **no credit card**,
and are more than enough for a hackathon demo:

| Provider | Free tier | Sign-up | Env (base URL / model) |
|---|---|---|---|
| **Groq** ⭐ recommended | Generous rate limits, very fast | console.groq.com | `https://api.groq.com/openai/v1` / `llama-3.3-70b-versatile` |
| **Google AI Studio (Gemini)** | Free tier, big context | aistudio.google.com | `https://generativelanguage.googleapis.com/v1beta/openai` / `gemini-2.0-flash` |
| **OpenRouter free models** | `:free` suffixed models | openrouter.ai | `https://openrouter.ai/api/v1` / `meta-llama/llama-3.3-70b-instruct:free` |
| **Cerebras** | Free tier, extremely fast | cloud.cerebras.ai | `https://api.cerebras.ai/v1` / `llama-3.3-70b` |
| **Mistral** | Free experimental tier | console.mistral.ai | `https://api.mistral.ai/v1` / `mistral-small-latest` |

Recommended pick: **Groq** — fastest time-to-first-token, which matters
because the CEO calls the LLM at mission start while the UI is watching.

Notes:
- The adapter is tolerant of free-model quirks: no `response_format`
  requirement, and it strips markdown fences / prose before JSON parsing.
- If the LLM call fails for any reason (rate limit, no key), planning
  falls back to a deterministic template — the demo never breaks.

## 2. Database — already free

SQLite file on disk (`data/agentaura.db`). No server, no cost. Schema
maps 1:1 to Postgres if you upgrade later.

## 3. OKX side — free by design

- **X Layer Testnet** (`eip155:1952`): test OKB (gas) and test USD₮0 are
  **free** from the official X Layer faucet. All agent payments/settlement
  demos run there. Nothing real is spent.
- **Agentic Wallet**: free, email login, keys held in OKX's TEE.
- **OKX.AI marketplace**: browsing/hiring flows have no platform fee for
  the hackathon scope.
- `DEMO_MODE=true` (default) simulates discovery/hiring/settlement through
  the same interfaces — zero cost, zero risk.

## 4. Optional research/search API (Research Agent enrichment)

Not required — the engine works without it. If you want live web data,
free options: Tavily (free monthly credits), Serper (free starter
credits), or Exa (free tier). Wire it inside the Research agent's tool
adapter; keep the key server-side (`RESEARCH_API_KEY`).

## 5. Hosting (if you deploy the demo)

- **Vercel free (Hobby) plan** runs Next.js as-is. SQLite won't persist on
  serverless — for a deployed demo, run with an attached disk (Railway/
  Render free tiers) or accept DB reseeding on cold start.
- Simplest for the hackathon: run locally or on your own machine during
  the recording.

## Summary

| Concern | Cost |
|---|---|
| App framework (Next.js) | Free, OSS |
| DB (SQLite) | Free |
| LLM (Groq/Gemini/OpenRouter-free) | Free tier |
| OKX testnet funds | Free faucet |
| OKX AI / Agentic Wallet | Free |
| **Total** | **$0** |
