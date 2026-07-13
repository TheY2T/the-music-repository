# Infrastructure

Local/deployable infrastructure for The Music Repository, as **Compose** files. Everything here
works with **Podman** (`podman compose`) and **Docker** (`docker compose`) — the files use
fully-qualified image names (`docker.io/...`, `ghcr.io/...`) and `:ro,Z` volume flags so they run
under both (`:Z` is a no-op outside SELinux hosts).

## Layout

```
infra/podman/
├─ compose.yaml                      # core app stack: db + flagd (+ api + web build targets)
└─ observability/                    # OPTIONAL telemetry stack (separate on purpose — see below)
   ├─ compose.observability.yaml     # collector + tempo + loki + prometheus + grafana
   ├─ otel-collector.yaml            # OTLP in → batch → Tempo/Loki/Prometheus
   ├─ tempo.yaml                     # traces backend
   ├─ prometheus.yml                 # scrapes the collector (:8889)
   └─ grafana-datasources.yaml       # provisions Tempo/Loki/Prometheus + Loki→Tempo trace link
```

App **Dockerfiles** live next to each app (`apps/api/Dockerfile`, `apps/web/Dockerfile`), built via
`turbo prune` multi-stage — see those files and ADR 0001.

## Commands (root `package.json`)

| Script | What it does |
|---|---|
Three opt-in layers — `infra` (base) → `app` (full app) → `obs` (optional telemetry):

| Command | What it does |
|---|---|
| `pnpm infra:up` | start the **backing services** — db + flagd + meilisearch + minio (`compose.yaml`). The everyday case: you run api/web on the host via `pnpm dev`. |
| `pnpm infra:down` | stop the app project (backing **and** app, if running) |
| `pnpm app:up` | start the **full containerized app** — backing services **+ api + web** (builds images). Adds the `app` compose profile on top of `infra:up`. |
| `pnpm app:down` | stop the app project (alias of `infra:down` — one project, one teardown) |
| `pnpm obs:up` | start the **optional observability** stack (`compose.observability.yaml`) |
| `pnpm obs:down` | stop the observability stack |

`api` and `web` carry the `app` compose **profile**, so a plain `docker compose up` (= `infra:up`)
starts only the backing services; `--profile app` (= `app:up`) opts the app containers in. A single
`down` tears the whole project down regardless of how it came up — hence one `down`, aliased.
On `app:up`, the `web` service waits for `api` to report **healthy** (via the api's `/health` check) so
first-paint SSR data fetches succeed. Web is served at http://localhost:4321.

## Port map

| Service | Host port | Notes |
|---|---|---|
| Postgres (`db`) | 5432 | app data |
| flagd | 8013 / 8016 | gRPC eval / OFREP HTTP |
| Meilisearch | 7700 | catalogue search (faceted, typo-tolerant) |
| MinIO | 9000 / 9001 | media object storage (S3 API) / console |
| api | 3000 | NestJS |
| web | 4321 | Astro SSR |
| OTel Collector | 4317 / 4318 / 8889 | OTLP gRPC / OTLP HTTP / Prometheus scrape |
| Tempo | 3200 | traces query API |
| Loki | 3100 | logs |
| Prometheus | 9090 | metrics |
| Grafana | **3001** | UI (3000 is taken by the api on the host) |

## Key decisions

### Why observability is a **separate** compose file (not merged into `compose.yaml`)
1. **Cost/weight.** The core stack is 2 light containers (Postgres + flagd) needed every session; the
   observability stack is **5 heavier ones** (collector, Tempo, Loki, Prometheus, Grafana) — GBs of
   images and real RAM/CPU. Keep the everyday `infra:up` fast and opt into telemetry only when needed.
2. **Different dependency relationship.** The app **requires** db + flagd to function. It does **not**
   require the observability backends — it exports OTLP and **degrades gracefully** if the collector
   isn't running (no traces exported; logs still go to stdout). So it's a genuinely independent lifecycle.
3. **Optional & swappable.** Observability is vendor-neutral: you might point OTLP at a SaaS
   (Grafana Cloud / Honeycomb / Datadog) and never run the local stack. A separate file makes
   "optional, replaceable infra" explicit, under its own compose project (`tmr-observability`) so it
   tears down independently of your data. See ADR 0008.
4. **Faster inner loop.** Booting/tearing down 2 containers vs 7 is a meaningful iteration difference.

**To run everything at once** (prod-like / demo), merge the files instead of duplicating:
```bash
docker compose -f infra/podman/compose.yaml \
               -f infra/podman/observability/compose.observability.yaml \
               --profile app up   # --profile app pulls in the api + web containers
```

### Why the folder is `podman/` but the files run on Docker too
Podman is the primary/target runtime (rootless, daemonless — see ADR 0001). The Compose spec is
shared, so the same files run on Docker; the fully-qualified images + SELinux-safe volume flags keep
them portable.

### Config lives in git, not in images
flagd flags (`flags/flags.json`), collector/Tempo/Prometheus configs, and Grafana datasource
provisioning are all **files mounted read-only** — GitOps-friendly, reviewable in PRs, and hot-reloaded
where the tool supports it (flagd, Grafana provisioning).

## Related docs
- Observability design & correlation: [`docs/features/observability.md`](../docs/features/observability.md), ADR 0008.
- Deployment / Dockerfiles: ADR 0001; app `Dockerfile`s under `apps/*`.
- Feature flags (flagd): [`docs/features/feature-flags.md`](../docs/features/feature-flags.md), ADR 0003.
