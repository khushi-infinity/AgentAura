# Deploying AgentAura

AgentAura is a **standard Node.js app with a file-based SQLite database**. That
makes deployment simple — but it also means the host must provide **persistent
disk** for `./data/` (the company, wallet, ledger and append-only audit trail
all live in `data/agentaura.db`). Any container/VM host with a volume works.

> **One-line summary:** Node 20+ · `npm ci && npm run build` · run
> `npx next start -p 3000` · mount `./data` somewhere persistent.
> The included `Dockerfile` does all four for you.

> ⚠️ **Do not deploy to Vercel, Netlify, or any serverless platform.** The
> engine runs background missions in-process, streams SSE, and writes to a
> local SQLite file — none of which survive serverless. Pick a long-running
> host.
>
> Concretely (why Netlify specifically fails, verified against their docs):
> serverless functions cap at **~10s execution** (the mission engine needs
> minutes for LLM planning + hire-approval windows), function filesystems are
> **ephemeral** (the SQLite ledger would vanish between invocations), and SSE
> activity feeds need long-lived connections serverless isn't designed for.
> Netlify Background Functions (15 min, Pro plan) would fix timeouts only —
> the disk and SSE problems remain. Re-architecting for serverless would
> mean Postgres + a queue + polling; the single `DEMO_MODE`-labeled container
> on Railway/Render/Fly is the honest deployment for this architecture.

---

## 1. Pick a host

| You want… | Pick | Effort |
|---|---|---|
| Fastest hackathon URL, ~5 minutes | **Railway** or **Render** | Easy — deploy the repo or the Dockerfile |
| Cheapest real VM + full control | **Fly.io** or any VPS (Hetzner/DigitalOcean) | Medium |
| Everything already on your laptop | `npm run build && npx next start` | None |

---

## 2. Option A — Railway (fastest)

1. Push this repo to GitHub.
2. [railway.com](https://railway.com) → **New Project → Deploy from GitHub repo** → pick the repo.
   Railway auto-detects the `Dockerfile`. If it asks, choose **Dockerfile deploy**.
3. In the service → **Variables**, add (all optional):

   ```
   OPENAI_API_KEY=…          # any OpenAI-compatible provider for live LLM planning
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   OPENAI_MODEL=llama-3.3-70b-versatile
   DEMO_MODE=true            # keep simulated (honestly labeled) OKX settlements
   ONCHAINOS_NETWORK=xlayer-testnet
   ```

4. **Settings → Volumes** → **New Volume** → mount path `/app/data`. This is what
   makes companies/wallets survive restarts. (The image runs as root so it can
   create the SQLite file on the root-owned volume mount — verified live on
   Railway. On a VPS you can keep `USER node` and chown the mount instead.)
5. **Settings → Networking → Generate Domain** → you get a public URL.
6. Visit the URL → the app migrates its DB on first request and lands on the
   Welcome screen.

> **Verified live:** `https://web-production-e03209.up.railway.app` — deployed
> via the Railway CLI from this Dockerfile, volume attached, LLM planner,
> hire-approval gate and 5% fee settlement all exercised in production.
> The `PORT` env var injected by the platform is respected
> (`next start -p ${PORT:-3000}`).

## 3. Option B — Render

1. [render.com](https://render.com) → **New → Web Service** → connect the repo.
2. Runtime: **Docker** (it finds the `Dockerfile` automatically). Instance: the
   smallest one is fine (512 MB is enough).
3. Add the same env vars as above under **Environment**.
4. **Disks → Add Disk** → mount path `/app/data`, 1 GB. Without this the DB is
   wiped on every deploy.
5. Deploy → note the `onrender.com` URL.

## 4. Option C — Fly.io

```bash
fly launch --no-deploy               # detects the Dockerfile; answer the prompts
fly volumes create agentaura-data --size 1 --region iad
fly secrets set OPENAI_API_KEY=… OPENAI_BASE_URL=… OPENAI_MODEL=… DEMO_MODE=true
fly deploy
fly status                           # wait for "ready", then open the URL
```

In `fly.toml` make sure the volume is mounted:

```toml
[mounts]
  source = "agentaura-data"
  destination = "/app/data"
```

## 5. Option D — any VPS with Docker

```bash
# on the server
git clone <your-repo> agentaura && cd agentaura
docker build -t agentaura .
docker run -d --name agentaura \
  -p 80:3000 \
  -v agentaura-data:/app/data \
  --env-file .env.production \
  --restart unless-stopped \
  agentaura
```

Put nginx or Caddy in front for TLS if you want a custom domain. Update with:

```bash
git pull && docker build -t agentaura . && \
docker rm -f agentaura && \
docker run -d --name agentaura -p 80:3000 -v agentaura-data:/app/data \
  --env-file .env.production --restart unless-stopped agentaura
```

(The data volume is untouched by redeploys — that's the point.)

---

## 6. Going live with real OKX settlements (optional)

Demo mode is right for a hosted link. If you want **real X Layer testnet
transactions**, do the human steps and flip one var:

```bash
npx -y @okxweb3/onchainos-installer install   # 1. install the CLI (your machine)
onchainos wallet login                        # 2. email OTP — must be you
onchainos wallet address                      # 3. copy the address
#    fund it: web3.okx.com/xlayer/faucet → test OKB + test USD₮0
node scripts/x402-smoke.mjs                   # 4. must print a real txHash
```

Then set on the host: `DEMO_MODE=false`, `OKX_ASP_RESOURCE_URL`,
`OKX_MERCHANT_PAYTO` (see `.env.example`) and redeploy. Missing prerequisites
fail **honestly** — a hire degrades to `PAYMENT_FAILED` with the fix in the
message; the mission itself still completes via internal fallback.

---

## 7. Pre-flight checklist (2 minutes before you share the link)

- [ ] **Pristine first impression**: run `npm run db:reset` **while the server is
      stopped**, then start it. First visitor lands on the Welcome screen.
- [ ] `GET <url>/api/config` returns `200` — quick health check.
- [ ] Walk the demo path once on the deployed URL (create → mission → hire).
- [ ] `DEMO_MODE=true` unless you completed §6 — the UI shows the honest
      "DEMO RAIL" badge, which judges like.
- [ ] Optional: `POST <url>/api/seed-demo` if you want the link to open on a
      populated workspace instead of onboarding.
- [ ] Never commit `.env.local`; host secrets go in the host's env UI.
