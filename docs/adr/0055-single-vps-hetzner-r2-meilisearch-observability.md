# ADR 0055 — Single-VPS hosting on Hetzner (Cloudflare Tunnel + R2 media + Meilisearch + observability)

- **Status:** Accepted (supersedes ADR 0049; amends ADR 0048 — search and media return as
  env-selected adapters, with Postgres kept as the default/fallback)
- **Context:** The private dev environment ran on Render (2× Docker web services + managed Postgres,
  ADR 0049). For a media-heavy catalogue aimed at a global audience at thousands of users/day, Render's
  per-GB egress and the cost of adding managed search/observability made a single self-managed box more
  economical and flexible (see `docs/audits/hosting-comparison-2026-07.md`). Moving to a VPS also lets
  the dormant OpenTelemetry stack (ADR 0008) and the retired Meilisearch/MinIO capabilities (ADR 0048)
  come back as ordinary containers on the same host rather than paid managed services.
- **Decision:**
  - **One Hetzner box (US-East/Ashburn, CPX41: 8 vCPU / 16 GB / 240 GB NVMe, 20 TB traffic)** runs the
    whole stack via `infra/podman/compose.prod.yaml`: Postgres, Meilisearch, the API and web images, the
    self-hosted observability stack (OTel Collector → Tempo/Loki/Prometheus → Grafana), and a Cloudflare
    Tunnel. A one-shot `init` service runs `db:deploy` (migrate + seed) — the compose equivalent of
    Render's `preDeployCommand`.
  - **Cloudflare Tunnel (`cloudflared`) is the only ingress.** No ports are published on any service and
    the origin IP is never exposed; the tunnel routes `themusicrepository.com`/`www` → web,
    `api.` → API, and `grafana.` → Grafana. TLS is terminated at Cloudflare and the tunnel is encrypted
    end-to-end, so there is no origin certificate to manage on the box.
  - **Media moves to Cloudflare R2** behind the existing `MediaLibrary` port via a new `S3MediaLibrary`
    (S3-compatible) adapter. R2 is a **public bucket on `media.themusicrepository.com`**, so the browser
    reads bytes directly from the edge (zero origin egress) and uploads via a short-lived presigned PUT.
  - **Search returns to Meilisearch** behind the existing `CatalogueSearch` and `CollectionSearchIndex`
    ports via `MeiliCatalogueSearch` / `MeiliCollectionSearch`, restoring typo-tolerant, faceted search.
  - **Adapter selection is env-driven**, mirroring the Mail/WhatsApp/Billing pattern: `MEILI_HOST`
    switches search to Meilisearch, `R2_BUCKET` switches media to R2; unset, both fall back to the
    Postgres adapters. So local dev and CI stay Postgres-only with no extra services, and the app still
    boots if either dependency is absent.
  - **Observability is activated** by pointing the already-preloaded OTel SDK at the collector
    (`OTEL_EXPORTER_OTLP_ENDPOINT`); no application code changes. Grafana is locked down (no anonymous
    access, admin password) and reachable only through the tunnel behind Cloudflare Access.
- **Consequences:**
  - What carries over from ADR 0049 unchanged: Cloudflare Access on apex+www (Grafana added), the
    `AUTH_COOKIE_DOMAIN` cross-subdomain cookie, `TRUSTED_ORIGINS`, Resend SMTP, the CDN cache rules, and
    `APP_ENV`-driven de-indexing. Web `PUBLIC_*` config is still baked at Docker build (compose
    `build.args`); the production web entry stays `server.mjs` (ADR 0051).
  - Operating the box is now self-managed: OS patching, Postgres backups (`pg_dump`/off-box copies), and
    image-tag currency are the operator's responsibility. The single box is a single point of failure
    without a standby.
  - Existing media in Postgres migrates to R2 with `pnpm --filter @TheY2T/tmr-api db:migrate-media`
    (idempotent); a fresh seed writes media straight to R2 when R2 is configured.
  - Full provisioning and cutover steps live in `docs/runbooks/deploy-hetzner.md`; the Render runbook is
    superseded.
