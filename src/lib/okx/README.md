# OKX Adapter Layer

All OKX-specific code is isolated here (spec §16). Nothing outside this
folder may call OKX directly.

## Verified integration path (official docs — do not invent endpoints)

| Concern | Mechanism | Source |
|---|---|---|
| Service discovery | OKX.AI marketplace ASP services (A2A / A2MCP) | `web3.okx.com/onchainos/dev-docs/okxai/asp-introduction` |
| Hiring flow | Publish task → match ASP → deliver → accept → bounty released | `web3.okx.com/onchainos/dev-docs/okxai/user-buy-service` |
| Payments | Agent Payments Protocol (x402 v2): 402 → sign EIP-3009 → `PAYMENT-SIGNATURE` replay → receipt `{txHash}` | `web3.okx.com/onchainos/dev-docs/payments/app` |
| Wallet | Onchain OS Agentic Wallet (email login, TEE key) — `npx -y @okxweb3/onchainos-installer install`, `onchainos wallet login` | `web3.okx.com/onchainos/dev-docs/home/agentic-wallet-overview` |
| Network | X Layer testnet `eip155:1952`, gas = test OKB, token = test USD₮0 `0x9e29...fb0c` | `web3.okx.com/onchainos/dev-docs/payments/payment-use-buyer` |

Service-type semantics (from docs):

- **A2A**: agents negotiate scope/price; funds held in an on-chain escrow
  contract, released after user acceptance; evaluation/dispute path exists
  (5% deposit to initiate). Suits complex, non-standard work.
- **A2MCP**: standardized priced tool calls, settled instantly via the
  Payment SDK. Suits fixed-price API-ish services.

## DEMO_MODE (spec §18)

`DEMO_MODE=true` (default) simulates discovery, hiring, execution and
settlement **through the same adapter interfaces**. Simulated results are
flagged `isDemo` everywhere and UI labels them "simulated". No simulated
transaction is ever claimed to be onchain. Flip to `DEMO_MODE=false` only
after the Onchain OS skills are installed and the Agentic Wallet is
logged in — the live adapters currently throw with instructions.
