# The Music Repository

> One of the world's most comprehensive musical repositories.

A music-learning **repository/catalogue website** — a library of teaching materials and songs
(piano & guitar to start), categorised by style/genre, instrument, difficulty/grade, and content
type, that people learn music from. Content is originally-hosted + public-domain, and the platform
progressively grows interactive capabilities (keyboard/fretboard, circle of fifths, ear-training,
flashcards, notation rendering, play-along) shipped in phases behind feature flags.

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm workspaces + **pnpm catalogs** |
| Frontend | Astro (SSR) + React islands + Tailwind v4 + shadcn/ui |
| Backend | NestJS (clean/hexagonal) + Postgres via **Drizzle** |
| Auth _(Phase 1)_ | Better Auth — Google + Microsoft/Entra, permission-based RBAC |
| Feature flags | **OpenFeature + flagd** (self-hosted, JSON-in-git) |
| Lint/format | Biome (primary) + thin ESLint |
| Deploy | single **podman-compose** (db + flagd + api + web) |

## Layout

```
apps/
  web/      # Astro SSR + React islands
  api/      # NestJS, hexagonal per-feature
packages/
  contracts/  # @TheY2T/tmr-contracts — shared Zod DTO/types (FE↔BE)
  flags/      # @TheY2T/tmr-flags — flag keys + eval-context
  ui/         # @TheY2T/tmr-ui — shared shadcn components (added when needed)
  config-*/   # shared tsconfig / biome / eslint
flags/       # flagd flag definitions (flags.json, GitOps)
infra/podman/# compose.yaml + Dockerfiles
docs/        # architecture, ADRs, feature docs, conventions
```

All workspace packages are scoped **`@TheY2T/tmr-*`**.

## Getting started

```bash
pnpm install
cp .env.example .env

# Bring up Postgres + flagd (Docker or Podman — the compose file works with both)
pnpm infra:up        # docker compose up -d db flagd   (stop later: pnpm infra:down)

# Run the apps in dev
pnpm dev                              # all apps via turbo
pnpm --filter @TheY2T/tmr-api dev     # API only
pnpm --filter @TheY2T/tmr-web dev     # web only
```

> If flagd isn't running, the apps still start and feature flags fall back to their default
> values — you'll see a one-line hint telling you to run `pnpm infra:up`.

- API: http://localhost:3000 (`GET /health`)
- Web: http://localhost:4321

## Common scripts

```bash
pnpm build         # turbo build across workspace
pnpm lint          # biome check + eslint
pnpm format        # biome format --write
pnpm check-types   # tsc --noEmit across workspace
pnpm test          # vitest across workspace
pnpm db:generate   # drizzle-kit generate (api)
pnpm db:migrate    # apply migrations (api)
```

## Docs

- Architecture, ADRs, conventions, and per-feature docs live in [`docs/`](./docs).
- Full build plan: `~/.claude/plans/mutable-inventing-acorn.md`.
- AI context: root & per-app `CLAUDE.md`.
