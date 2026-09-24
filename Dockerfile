# ── AgentAura production image ────────────────────────────────────────
# better-sqlite3 is a native module → compiled here for the image's platform
# (linux/amd64 on most hosts, arm64 if you build on Apple Silicon and deploy
# there). SQLite lives in /app/data — mount a volume so company data survives
# deploys and restarts.
#
#   docker build -t agentaura .
#   docker run -p 3000:3000 -v agentaura-data:/app/data --env-file .env.local agentaura

# ── deps: full install (dev deps are needed for the TS build) ─────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── build: compile Next.js, then prune dev deps ───────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# A build-time placeholder DB; the real one is created at runtime in /app/data.
RUN npm run build

# ── run: minimal image, non-root, persistent volume ───────────────────
FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/public ./public
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
