# syntax=docker/dockerfile:1
# Multi-stage build for the NestJS API using `turbo prune` so deps only reinstall when they change.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

# 1) Prune the monorepo down to just what @TheY2T/tmr-api needs.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.4 prune @TheY2T/tmr-api --docker

# 2) Install pruned deps (cached layer), then build.
FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@TheY2T/tmr-api

# 3) Slim, non-root runtime.
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY --from=installer --chown=nestjs:nodejs /app .
USER nestjs
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
