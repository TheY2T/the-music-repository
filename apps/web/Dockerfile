# syntax=docker/dockerfile:1
# Multi-stage build for the Astro SSR app (Node standalone adapter) via `turbo prune`.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.4 prune @TheY2T/tmr-web --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# turbo prune omits root-level config files, but packages/config-typescript/base.json extends
# `../../tsconfig.base.json` (the real compilerOptions incl. esModuleInterop). Copy it back in so
# tsc/tsup DTS builds resolve it — otherwise strict/interop options vanish and builds fail. ADR 0005.
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
# Public config is baked into the client bundle + Astro.site at build time. Render passes service env
# vars with matching ARG names as build args; locally they default to the dev origins.
ARG PUBLIC_SITE_URL=http://localhost:4321
ARG PUBLIC_API_BASE_URL=http://localhost:3000
ARG PUBLIC_KOFI_USERNAME=""
ARG PUBLIC_TURNSTILE_SITE_KEY=""
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL \
    PUBLIC_KOFI_USERNAME=$PUBLIC_KOFI_USERNAME \
    PUBLIC_TURNSTILE_SITE_KEY=$PUBLIC_TURNSTILE_SITE_KEY
RUN pnpm turbo run build --filter=@TheY2T/tmr-web

FROM base AS runner
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
RUN addgroup -S nodejs && adduser -S astro -G nodejs
COPY --from=installer --chown=astro:nodejs /app .
USER astro
EXPOSE 4321
CMD ["node", "apps/web/dist/server/entry.mjs"]
