# Feature: Deployment (Hetzner VPS + Cloudflare Tunnel + R2 + Meilisearch + observability)

- **ADR:** [0055](../adr/0055-single-vps-hetzner-r2-meilisearch-observability.md) (supersedes
  [0049](../adr/0049-hosting-render-cloudflare-resend.md)) · **Status:** dev environment
- **Runbook:** [`deploy-hetzner.md`](../runbooks/deploy-hetzner.md) (step-by-step procedure).
- **Topology:** the whole stack runs on **one Hetzner box** via Docker Compose — Postgres, Meilisearch,
  API (NestJS), web (Astro SSR), the self-hosted observability stack, and a Cloudflare Tunnel. Media
  lives in Cloudflare R2. Search + media are **env-selected** adapters (Postgres is the fallback).

## Single-box compose (`infra/podman/compose.prod.yaml`)

| Service | Notes |
|---|---|
| `db` | Postgres 16, `pgdata` volume |
| `meilisearch` | Faceted/typo-tolerant search; `meili_data` volume |
| `init` | One-shot: waits for Meilisearch, then `db:migrate && db:seed:auth && (db:seed \|\| true)` (builds the search index + writes seed media to R2) |
| `api` | Docker (`apps/api/Dockerfile`), port 3000, health `/health` |
| `web` | Docker (`apps/web/Dockerfile`), port 4321, entry `server.mjs` |
| `otel-collector`/`tempo`/`loki`/`prometheus`/`grafana` | Observability stack (traces/logs/metrics/dashboards), volumes for retention |
| `cloudflared` | Cloudflare Tunnel — the only ingress |

- **Migrations/seed** run in the `init` service (the compose equivalent of a pre-deploy hook). The runner
  image contains `drizzle-kit` + the `drizzle/` folder.
- **Web ↔ API (server-side)** uses the compose network: `API_INTERNAL_URL=http://api:3000`.
- **Build-time public config** is baked into the web image via Dockerfile `ARG`s (compose `build.args`):
  `PUBLIC_SITE_URL`, `PUBLIC_API_BASE_URL` (+ optional `PUBLIC_KOFI_USERNAME`, `PUBLIC_TURNSTILE_SITE_KEY`).
- **Secrets** live in a root `.env` (chmod 600) that the compose reads; generate `BETTER_AUTH_SECRET`
  yourself (no Render `generateValue`).

## Env-selected search + media

- **Search:** `MEILI_HOST` set → `MeiliCatalogueSearch`/`MeiliCollectionSearch`; unset → the in-memory
  Postgres adapters. Same ports, same result contract.
- **Media:** `R2_BUCKET` set → `S3MediaLibrary` (Cloudflare R2, public bucket on
  `media.themusicrepository.com`; browser reads direct, presigned PUT for uploads); unset →
  `PostgresMediaLibrary` (`media_objects`, served from `GET /media`).
- Existing Postgres media migrates with `pnpm --filter @TheY2T/tmr-api db:migrate-media` (idempotent).
- `pnpm app:up` runs the full local stack (Postgres + Meilisearch + MinIO + API + web) so search/media
  are exercised the same way as prod (the S3 adapter is generic — R2 in prod, MinIO locally).

## Cloudflare

- **Ingress:** a **Cloudflare Tunnel** (`cloudflared` container) is the only path in — no inbound ports,
  origin IP hidden. Public hostnames route apex/`www` → web, `api.` → API, `grafana.` → Grafana. TLS is
  terminated at Cloudflare; the tunnel is encrypted end-to-end (no origin cert on the box).
- **R2:** the `tmr-media` bucket is exposed on `media.themusicrepository.com` (public reads) with a CORS
  policy allowing `PUT` from the site origin (CMS uploads).
- **Cloudflare Access (Zero Trust):** one Access application over apex + `www` + `grafana.` (the operator's
  email); `api.` stays **ungated** (gating it breaks CORS/OAuth).
- **De-indexing (defence in depth):** with `APP_ENV != production`, `BaseLayout` emits a global
  `noindex,nofollow` and `robots.txt` returns `Disallow: /`.
- **CDN caching:** origins compress + set `Cache-Control`; Cloudflare Cache Rules (auth-cookie bypass)
  activate edge caching. See [caching.md](./caching.md) + ADR 0051.

## Observability

The OTel SDK is preloaded in the API image; setting `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317`
(done in the prod compose) activates it — traces → Tempo, logs → Loki, metrics → Prometheus, viewed in
Grafana. Grafana is locked down (no anonymous access, admin password) and reachable only through the
tunnel behind Access. See ADR 0008.

## Resend + contact form

Unchanged: Resend via the SMTP path (`SMTP_URL=smtps://resend:<key>@smtp.resend.com:465`, verified
`MAIL_FROM`), Better Auth account emails + the contact form (`contact.md`, protected by Turnstile). Add
the SPF/DKIM/DMARC records to Cloudflare DNS.

## Cross-subdomain auth

`AUTH_COOKIE_DOMAIN=.themusicrepository.com` shares the Better Auth session cookie across the apex and
`api.` (`SameSite=None; Secure`); `TRUSTED_ORIGINS`/`BETTER_AUTH_URL` name the real HTTPS origins. Unset
locally, where host-only lax cookies over http work.

## Verify

- `pnpm prod:up` brings the stack up; `init` migrates + seeds + indexes; `/health` is ok.
- Catalogue search is typo-tolerant with facet counts; CMS media upload lands in R2 and renders from
  `media.themusicrepository.com`.
- Cloudflare Access challenges apex/www/grafana (not api); `/robots.txt` is `Disallow: /` in dev.
- Grafana shows API traces/logs/metrics. Sign in on the apex → the cookie reaches `api.`.
