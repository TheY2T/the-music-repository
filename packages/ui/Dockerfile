# syntax=docker/dockerfile:1
# Multi-stage build for the design-system Storybook (@TheY2T/tmr-ui) via `turbo prune`, served as a
# static site by nginx. Mirrors apps/web/Dockerfile. Build from the repo root.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.3 --activate
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.4 prune @TheY2T/tmr-ui --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# turbo prune omits root-level config files, but packages/config-typescript/base.json extends
# `../../tsconfig.base.json` (the real compilerOptions). Copy it back so tsc/tsup DTS builds of the
# workspace deps (i18n, contracts) resolve it — otherwise strict/interop options vanish. ADR 0005.
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
# `^build` builds the dual-built workspace deps (i18n, contracts, …) first, then the static Storybook.
RUN pnpm turbo run build-storybook --filter=@TheY2T/tmr-ui

FROM docker.io/library/nginx:alpine AS runner
# Serve the prebuilt static Storybook. nginx listens on 6006 to match the conventional Storybook port.
COPY --from=installer /app/packages/ui/storybook-static /usr/share/nginx/html
RUN sed -i 's/listen\( \)*80;/listen 6006;/' /etc/nginx/conf.d/default.conf
EXPOSE 6006
