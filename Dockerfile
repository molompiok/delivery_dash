# ╔══════════════════════════════════════════════════════════════════════╗
# ║  delivery-etp-dash — Dockerfile multi-stage (Vike SSR, pnpm)         ║
# ╚══════════════════════════════════════════════════════════════════════╝

# ── Stage unique : build complet ───────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── Stage de production ────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copier le build Vike ET les node_modules du MÊME build
# pour garantir que vike runtime == vike build (évite "Wrong Usage" error)
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

RUN chown -R appuser:appgroup /app
USER appuser

ENV PORT=4002
ENV HOST=0.0.0.0
ENV NODE_ENV=production

HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --spider http://0.0.0.0:${PORT:-4002}/ || exit 1

CMD ["node", "./dist/server/index.mjs"]
