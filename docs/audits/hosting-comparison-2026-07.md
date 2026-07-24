# Hosting Comparison — Alternatives to Render

_Date: 2026-07-24 · Scope: the production deployment of `apps/web` + `apps/api` + Postgres, and the bandwidth/cost economics of hosting them for a global audience at thousands of users/day._

This audit evaluates whether to stay on Render, move to a cheaper or higher-bandwidth managed
platform, or self-host on a VPS for single-stack control and better bandwidth economics. It grounds
every option in what the app actually needs (from `render.yaml`, the Dockerfiles, the deploy runbook,
the caching ADRs, and the Drizzle schema), models the traffic, and prices each option in **AUD/month**.

> **Currency & date basis.** Costs use **1 USD ≈ 1.43 AUD** and **1 EUR ≈ 1.63 AUD** (mid-July 2026).
> All provider pricing is **as-of July 2026** and must be re-checked at decision time — cloud pricing
> changes frequently (Hetzner and Render both changed plans in April 2026).

> **Bottom line up front.** The app already sits behind Cloudflare, so the host is billed for
> **origin egress**, not client-facing bandwidth. The single biggest lever — independent of host — is
> **moving media + soundfonts to zero-egress object storage (Cloudflare R2)**, which drops origin
> egress toward zero and largely decouples the hosting choice from the bandwidth problem. After that:
> **Hetzner (single VPS, ~A$25–40/mo, 20 TB traffic)** wins on cost/bandwidth/control;
> **DigitalOcean Droplet + Managed Postgres in Sydney (~A$56/mo)** is the low-ops, AU-region
> runner-up; **staying on Render + R2** is the zero-migration option.

> **Why a VPS unlocks the dormant/retired capabilities.** On managed platforms, turning on
> observability and re-adding search + object storage means paying for extra managed services. On a
> **single VPS they are just more containers in the same Docker Compose** — their cost is RAM + disk
> on one box, not monthly SaaS fees. The full self-hosted observability stack (§7) and a revived
> Meilisearch + MinIO (§8) fit on a **~16 GB Hetzner box for ~A$48/mo, still under the A$150 target**.
> See §7–§8 for what "on" requires and the costings; the sizing lands in the revised scenarios (§5).

---

## 1. The stack a replacement must satisfy

Sources: `render.yaml`, `apps/{api,web}/Dockerfile`, `docs/runbooks/deploy-from-scratch.md`,
`docs/features/caching.md`, ADR 0048/0049/0051, `apps/api/src/config/env.ts`, `apps/api/src/infrastructure/database/schema.ts`.

**Current footprint (Render `oregon`):**

| Service | Type | Plan | Port | Notes |
|---|---|---|---|---|
| `tmr-api-dev` | Docker web | `starter` | 3000 | NestJS; `/health` check; pre-deploy migrate+seed |
| `tmr-web-dev` | Docker web | `starter` | 4321 | Astro SSR via custom `server.mjs`; calls API on private net |
| `tmr-db-dev` | Managed Postgres 16 | `basic-256mb` | — | The **only** stateful backend |

Currently a **private dev environment** (~US$20/mo, behind Cloudflare Access). No cron, workers,
queues, persistent disks, Redis, Meilisearch, or S3 — ADR 0048 deliberately collapsed everything to
Postgres-only.

**What Postgres holds:** relational data, catalogue search (in-memory over the published set), Better
Auth sessions, the `rate_limit` table, **and media bytes** (`media_objects.data bytea`, served via
`GET /media` with ETag + `max-age=3600, stale-while-revalidate`). Stock **Postgres 16**, **no
extensions** beyond core (`gen_random_uuid`, `jsonb`, `bytea`) — so any vanilla PG 16 satisfies it.

**Heavy assets (the bandwidth question):** ~**86 MB** of soundfonts + **3.6 MB** notation font baked
into the web image (`apps/web/public/{soundfont,font}`), served `public, max-age=31536000, immutable`
by `server.mjs` (ADR 0051), plus media-object bytes from Postgres via the API.

**Cloudflare already fronts everything** — DNS proxied, Cache Rules on `/_astro`, `/font`,
`/soundfont` + public API GETs, Brotli, Access gate on web only. **The host is billed for *origin*
egress**; Cloudflare cache HITs never reach the origin.

**Host requirements a replacement must meet:**

- Node 22, Docker images built from the **monorepo root** (`turbo prune`, `dockerContext: .`).
- A **pre-deploy** step: `pnpm --filter @TheY2T/tmr-api db:deploy` (migrate + seed) before API goes live.
- API `/health` check; **private service-to-service networking** (web → api internal URL).
- **Build-arg baking** of `PUBLIC_*` into the web client bundle (not just runtime env).
- Two apps on **sibling subdomains of one parent domain over HTTPS** (cross-subdomain auth cookie
  `.themusicrepository.com`, `SameSite=None; Secure`).
- Custom domains required — both apps 404 the platform's default hostname.

---

## 2. The single biggest lever (applies to every option)

Because media lives in Postgres and soundfonts are baked into the image, **the biggest
bandwidth/cost win — regardless of host — is offloading media + soundfonts to object storage with
free egress:**

| Store | Storage price | Egress | Fit |
|---|---|---|---|
| **Cloudflare R2** | US$0.015/GB/mo | **$0 (zero egress)** | Best for web-facing media served frequently |
| **Backblaze B2** | US$0.006/GB/mo | Free via Cloudflare Bandwidth Alliance (else 3× stored free, then $0.01/GB) | Cheapest storage; pair with Cloudflare CDN |

A few GB of media on R2 costs **cents per month** and drops origin egress toward zero. This is worth
doing **before** — or instead of — any host migration.

_Sources: [Cloudflare R2 vs S3 vs B2 (2026)](https://tech-insider.org/cloudflare-r2-vs-s3-vs-backblaze-b2-2026/), [R2 pricing explained](https://mecanik.dev/en/posts/cloudflare-r2-pricing-explained-real-costs-vs-s3-and-backblaze/)._

---

## 3. Traffic + bandwidth model

"Thousands/day" modelled at three tiers (~30 days). Assumes Cloudflare caches static assets so
**origin egress is ~15–25% of client-facing bytes**; overages only bite if caching is misconfigured
or media stays on-origin.

| Tier | Users/day | ~Users/mo | Client-facing egress | Origin egress (CF-cached) | Origin egress (media on-origin, worst case) |
|---|---|---|---|---|---|
| **Low** | ~1,000 | ~30k | ~0.5–1 TB | ~100–200 GB | ~0.5 TB |
| **Med** | ~3,000 | ~90k | ~1.5–3 TB | ~300–600 GB | ~1.5 TB |
| **High** | ~10,000 | ~300k | ~5–10 TB | ~1–2 TB | ~5 TB+ |

Assumptions: ~2 MB blended egress per session to the client (first visit pulls a soundfont subset +
notation font + hashed JS/CSS; return visits are mostly cached). With Cloudflare + media on R2, even
the High tier keeps **origin egress ~1 TB** — which is exactly where per-GB pricing differences matter.

---

## 4. Options compared

### 4.1 Managed / PaaS (keep Render-like DX)

| Provider | Compute (scaled) | Managed Postgres | Included BW / overage | Est. AUD/mo (Med) | Notes |
|---|---|---|---|---|---|
| **Render** (baseline) | 2× Standard ~US$25 ea | basic/pro tier | **500 GB** then **$0.15/GB** | **~A$130–190** + overage | Zero migration; the **$0.15/GB overage is the pain point** |
| **DigitalOcean** (Droplet or App Platform) | Droplet 2vCPU/4GB/80GB NVMe ~US$24 | US$15 (1GB) / HA US$60 | pooled free tier, **$0.01/GiB** | **~A$56** (droplet + PG) | **SYD region**; DB↔compute same-region traffic **free**; overage **15× cheaper** than Render |
| **Fly.io** | Machines pay-as-you-go | Managed PG ~US$7+ | egress **$0.02/GB** | **~A$60–90** | Anycast multi-region (great for global); `syd` region; no free tier in 2026 |
| **Railway** | usage-based, US$20 min | US$10–40 | egress **$0.05–0.10/GB** | **~A$70–120** | Closest DX to Render; egress pricier; usage-based bill can drift |

_Sources: [Render outbound bandwidth](https://render.com/docs/outbound-bandwidth), [Render pricing 2026](https://render.com/blog/better-pricing-for-fast-growing-teams), [DO droplet pricing 2026](https://infratally.com/articles/digitalocean-droplet-pricing-guide-2026/), [DO Managed Postgres 2026](https://infratally.com/articles/digitalocean-managed-postgres-deep-dive/), [Fly.io pricing](https://fly.io/docs/about/pricing/), [Fly hidden costs 2026](https://sota.io/blog/fly-io-hidden-costs-2026), [Railway pricing 2026](https://www.srvrlss.io/provider/railway/)._

### 4.2 Self-managed VPS (single stack, most control + bandwidth)

| Provider | Plan | Included BW / overage | Est. AUD/mo | Notes |
|---|---|---|---|---|
| **Hetzner** | CPX32 4vCPU/8GB/160GB NVMe €15 (or CPX22 2vCPU/4GB €8) | **20 TB** then **€1/TB** | **~A$25–40** (whole stack, one box) | **Best bandwidth economics by far**; **no Sydney region** (EU/US only) — Cloudflare masks latency; you run Postgres + backups |
| **DigitalOcean Droplet** | 2vCPU/4GB/80GB NVMe US$24 | pooled free, **$0.01/GiB** | **~A$35** + PG | **SYD region** |
| **Vultr HF** | NVMe from US$6 (1GB) | generous, overage **$0.01/GB — but AU $0.10/GB** | **~A$30–50** | **SYD region**, but **AU egress is 10× dearer** — a trap for AU-first traffic |

Self-managed means you own: OS patching, **Postgres backups** (`pg_dump`/PITR + off-box copies), TLS
(or a Cloudflare origin cert), monitoring, and there's **no push-to-deploy** unless you add it
(Docker Compose + a webhook or a small CI step). The app is already Docker Compose–shaped
(`pnpm app:up`), so a single VPS running the same compose file is a natural fit.

_Sources: [Hetzner pricing 2026](https://comparedge.com/tools/hetzner/pricing), [Hetzner review 2026](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/), [Vultr pricing 2026](https://onedollarvps.com/pricing/vultr-pricing)._

### 4.3 Hybrid (VPS compute + managed data + object storage/CDN)

VPS for app compute + **either** managed Postgres (DO Managed PG) **or** self-hosted PG on the box,
with **Cloudflare CDN in front + media/soundfonts on R2 (zero egress)**. Object-storage cost for a few
GB of media is **cents/month**. This isolates the stateful/backup risk (managed PG) while keeping
compute cheap and egress near-zero — the best of both worlds if you want low bandwidth cost without
owning Postgres operations.

---

## 5. Scenarios costed (all-in, AUD/mo)

Each scenario assumes **Cloudflare in front + media on R2**, so origin egress stays low.

| Scenario | Low (~1k/day) | Med (~3k/day) | High (~10k/day) |
|---|---|---|---|
| **A. Render (stay) + R2** | ~A$45 | ~A$90–130 | ~A$150–200 (compute scale) |
| **B. Hetzner single VPS (app + PG) + R2** | **~A$27** | **~A$30** | **~A$40** (bigger box; 20 TB covers it) |
| **C. DO Droplet + Managed PG (SYD) + R2** | ~A$50 | **~A$56** | ~A$90 (add HA/larger PG) |
| **D. Fly.io (global anycast) + R2** | ~A$45 | ~A$65 | ~A$110 |
| **E. Hetzner "full stack" VPS + R2** — app + PG **+ Meilisearch + self-hosted observability** | ~A$48 | **~A$48** | ~A$65 (16→32 GB box) | 

Notes: R2 storage/ops for the media set is ~A$1–3/mo across all scenarios. Hetzner's flat 20 TB
allowance means bandwidth is effectively a non-cost even at the High tier; the variation is compute
size, not egress. **Scenario E is the key answer to "bring search + observability back":** the extra
containers cost only RAM/disk — a 16 GB box (Hetzner CPX41/CCX23, ~A$48/mo) holds app + Postgres +
Meilisearch + the Loki/Tempo/Prometheus/Grafana stack comfortably, versus ~A$50–90/mo of *additional*
SaaS fees to get the same on a managed platform (Meilisearch Cloud + Grafana Cloud). RAM budget for E:
app ~1.5 GB, Postgres ~1 GB, Meilisearch ~1–2 GB, observability stack ~2–4 GB → 16 GB with headroom.

---

## 6. Recommendation

Ranked for a **global/mixed audience, thousands/day, A$50–150 target**, weighing bandwidth economics,
cost, Postgres reliability, and ops effort:

1. **Top pick — bandwidth + cost + control: Hetzner CPX32 single VPS + Cloudflare + R2.**
   Run the existing Docker Compose (web + API + Postgres) on one box. **~A$25–40/mo**, **20 TB**
   egress headroom, full single-stack freedom, NVMe. Trade-offs: **no AU region** (Cloudflare edge +
   cached/immutable assets largely hide this for a read-heavy catalogue), and **you own Postgres
   backups + OS patching**. Best fit for "host the whole app on one stack, serve bandwidth
   efficiently, keep costs low."

2. **Runner-up — low-ops, AU-region: DigitalOcean Droplet + Managed Postgres in Sydney + R2.**
   **~A$56/mo**, cheap **$0.01/GiB** overage, **managed DB removes the backup/PITR burden**, and the
   **SYD region** helps if the audience skews AU. Same-region DB↔droplet traffic is free. The
   pragmatic middle ground between full self-host and full PaaS.

3. **Stay-on-Render option (lowest effort): Render + move media/assets to R2.**
   If migration isn't worth the effort, just **offload media + soundfonts to R2** and verify
   Cloudflare caching. That alone likely eliminates the **$0.15/GB** overage exposure while keeping
   Render's push-to-deploy DX. Cheapest change, keeps everything else as-is.

**Avoid for AU-first traffic:** Vultr's **A$0.10/GB Australian egress** (10× its other regions)
undercuts its otherwise-cheap compute.

### Migration risk / effort per option

| Option | Effort | Key risks |
|---|---|---|
| Render + R2 | **Low** | Wiring an S3-compatible media adapter (replace `PostgresMediaLibrary`); Cloudflare Cache Rule for R2 origin |
| DO Droplet + Managed PG | **Medium** | Recreate service networking + pre-deploy migrate/seed; point domains; managed-PG connection limits/pooling |
| Hetzner single VPS | **Medium–High** | You own Postgres backups (`pg_dump`/PITR + off-box), OS patching, TLS/origin cert, and a deploy mechanism (compose + webhook/CI); single box = single point of failure without a standby |
| Fly.io | **Medium** | Machines/volumes model differs from Render; per-region cost multiplication if you go multi-region |
| + Turn on observability | **Low** | No app code change — deploy/point at a collector + set `OTEL_*` env (validate in `env.ts`). Grafana Cloud free tier needs zero infra |
| + Revive Meilisearch | **Medium** | Rebuild `Meilisearch{Catalogue,Collection}Search` adapters behind intact ports, restore dep + tsconfig `paths`, real `indexAll`, `MEILI_*` env, run an instance |
| + Revive object storage | **Low–Medium** | Write one `S3MediaLibrary` adapter (R2 preferred) behind `MediaLibrary`, restore AWS SDK deps, `S3_*` env, swap binding; migrate `media_objects` bytea rows out |

### Cross-cutting prerequisites (any move)

- Add an **S3-compatible `MediaLibrary` adapter** (R2) alongside the current `PostgresMediaLibrary`,
  and migrate the `media_objects` bytea rows out — this is the enabling step for the whole strategy.
- Keep **Cloudflare in front** everywhere; extend Cache Rules to the R2 media origin.
- Preserve the **cross-subdomain auth** setup (web + API on sibling subdomains, HTTPS, shared cookie
  domain) and the **pre-deploy migrate+seed** hook on whatever platform runs the API.

---

## 7. Turning observability on (currently dormant)

The full observability stack is **already built and wired in code** — it's just not receiving data in
production. Sources: `infra/podman/observability/compose.observability.yaml`, `packages/observability/`,
`apps/api/src/otel.ts` + `main.ts`, ADR 0008.

**What exists:**

- A self-hosted stack behind `pnpm obs:up` — **OpenTelemetry Collector** (`otel-collector-contrib`,
  OTLP gRPC `:4317` / HTTP `:4318`) → **Tempo** (traces `:3200`) + **Loki** (logs `:3100`) +
  **Prometheus** (metrics `:9090`, OTLP receiver enabled) → **Grafana** (dashboards `:3001`). Config
  files (`otel-collector.yaml`, `tempo.yaml`, `prometheus.yml`, `grafana-datasources.yaml`) sit
  alongside the compose. It is a **separate** compose project — `pnpm infra:up`/`app:up` don't start it.
- `@TheY2T/tmr-observability` — capability ports (`AppLogger`/`Tracer`/`RequestContext`) with
  Pino/OTEL/AsyncLocalStorage adapters; the OTEL `NodeSDK` bootstrap is **preloaded via
  `node --require ./dist/otel.js`** in the API start script, sampler `ParentBased(TraceIdRatio)`
  1.0 dev / 0.1 prod, 15 s metric export.

**Why it's dormant:** `render.yaml` and `apps/api/src/config/env.ts` set **no `OTEL_*` vars**, so the
OTLP exporters default to `localhost:4317` where nothing listens in prod. The SDK starts at boot but
exports go nowhere.

**What "on" requires (no app code change):**

1. A collector reachable from the API — either a deployed collector container or a SaaS OTLP endpoint.
2. Set `OTEL_EXPORTER_OTLP_ENDPOINT` (+ `OTEL_SERVICE_NAME`, `SERVICE_VERSION`, optional sampler arg)
   in the environment; ideally add them to `env.ts` Zod validation (currently absent).
3. Data then flows traces→Tempo, logs→Loki, metrics→Prometheus, viewed in Grafana.

**Costings:**

| Approach | Cost (AUD/mo) | Notes |
|---|---|---|
| **Self-host on the VPS** (Scenario E) | **~A$0 marginal** (just RAM/disk on the box) | Software is free; the LGTM-style stack wants **~2–4 GB RAM** + disk for retention. Only real cost is a bigger VPS. You own retention/compaction/backups. Fits the "single-stack, more freedom" goal. |
| **Grafana Cloud Free** | **A$0** | 10k metric series, **50 GB logs + 50 GB traces**, 14-day retention, 3 users, indefinite. For one small app this is likely **enough on its own** — point the collector/exporters at Grafana Cloud's OTLP endpoint, zero infra to run. |
| **Grafana Cloud Pro** | from ~A$27+ (US$19) + usage | If you outgrow free: metrics US$6.50/1k series, logs & traces US$0.45/GB over the free allowance. |

**Recommendation for observability:** if on a VPS, self-host it (marginal cost ≈ RAM). If you'd
rather not run it, **Grafana Cloud's free tier is the pragmatic default** and works from any host —
including Render — by just setting the OTLP endpoint + a couple of env vars. Note the self-hosted
"$800/mo" figures you'll see online are enterprise-scale; at this app's volume it's a RAM line item.

_Sources: [Grafana Cloud pricing 2026](https://costbench.com/software/observability/grafana-cloud/), [Grafana Cloud free plan limits](https://costbench.com/software/observability/grafana-cloud/free-plan/), [Cloud vs self-hosted 2026](https://pickuma.com/for-dev/grafana-cloud-vs-self-hosted-2026/)._

---

## 8. Bringing back Meilisearch + object storage on a VPS

Both were **removed from the tree** (ADR 0048 collapsed them to Postgres) — the ports and call sites
survive, but the adapters must be **rebuilt**, not just re-enabled. Sources: ADR 0010/0011/0048,
`apps/api/src/catalogue/**`.

**What survives vs what's gone:**

- **Ports intact:** `CatalogueSearch` (+ `CollectionSearchIndex`) and `MediaLibrary` abstract classes,
  with all call sites (reindex-on-write, seed reindex, `/media` controller). Only Postgres adapters
  are bound today (`PostgresCatalogueSearch`, `PostgresMediaLibrary`).
- **Gone:** every Meilisearch/MinIO adapter, the `meilisearch` + `@aws-sdk/client-s3` +
  `s3-request-presigner` deps, all `MEILI_*`/`S3_*` env, and the compose service definitions.
  `CatalogueReindexService.indexAll` is a no-op. (Doc drift: root `CLAUDE.md` still claims
  `infra:up` starts `db+meili+minio` — today it starts Postgres only.)

**Search — re-adding Meilisearch (contained adapter rebuild):**

- Write `MeilisearchCatalogueSearch` (+ `MeilisearchCollectionSearch`) behind the existing port;
  restore the `meilisearch` dep + its tsconfig `paths` mapping; give `indexAll` a real body; add
  `MEILI_HOST`/`MEILI_MASTER_KEY` to `env.ts` + config; swap the binding in `catalogue.module.ts`;
  run a Meilisearch instance.
- **Gain:** typo-tolerance + first-class faceting with counts (what Postgres in-memory search can't do).
- **Cost:** self-host on the VPS is **~A$0 marginal** — at this catalogue size (low hundreds of items)
  Meilisearch needs **~1–2 GB RAM** and is MIT-licensed/free. (The "1 GB data ≈ 35 GB RAM" figure is
  for large datasets; irrelevant here.) Managed **Meilisearch Cloud is US$23–30/mo (~A$33–43)** if you
  don't want to run it — which on a VPS defeats the point.

**Object storage — re-adding S3/MinIO (or R2):**

- ADR 0048 frames this as **"one binding change"**: write an `S3MediaLibrary` (works for MinIO **or**
  Cloudflare R2) implementing `MediaLibrary`, restore the AWS SDK deps, add `S3_*` creds/endpoint, swap
  the binding. Presigned direct-to-bucket URLs return, taking media bytes off the API path entirely.
- **Recommendation: prefer R2 over self-hosted MinIO.** MinIO self-hosted is free but adds a container
  **plus a disk you must back up**, and still egresses through the VPS. **R2 gives zero egress + offloads
  the bytes for ~cents/mo** — it's the §2 lever, and the same adapter code. Reach for MinIO only if you
  specifically want everything on one box with no external dependency.

**Net effect on sizing:** adding Meilisearch (self-hosted) + observability (self-hosted) is what moves
the recommended VPS from an 8 GB box (~A$30) to a **16 GB box (~A$48)** — **Scenario E**, still under
the A$150 ceiling, and cheaper than buying the equivalents as managed SaaS.

---

## 9. Sources

- [Render — Outbound Bandwidth docs](https://render.com/docs/outbound-bandwidth) · [Render pricing 2026](https://render.com/blog/better-pricing-for-fast-growing-teams)
- [DigitalOcean Droplet pricing 2026](https://infratally.com/articles/digitalocean-droplet-pricing-guide-2026/) · [DO Managed Postgres 2026](https://infratally.com/articles/digitalocean-managed-postgres-deep-dive/) · [DO pricing page](https://www.digitalocean.com/pricing)
- [Hetzner pricing 2026](https://comparedge.com/tools/hetzner/pricing) · [Hetzner Cloud review 2026](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/)
- [Fly.io pricing](https://fly.io/docs/about/pricing/) · [Fly.io hidden costs 2026](https://sota.io/blog/fly-io-hidden-costs-2026)
- [Railway pricing 2026](https://www.srvrlss.io/provider/railway/)
- [Vultr pricing 2026](https://onedollarvps.com/pricing/vultr-pricing)
- [Cloudflare R2 vs S3 vs B2 (2026)](https://tech-insider.org/cloudflare-r2-vs-s3-vs-backblaze-b2-2026/) · [R2 pricing explained](https://mecanik.dev/en/posts/cloudflare-r2-pricing-explained-real-costs-vs-s3-and-backblaze/)
- Observability: [Grafana Cloud pricing 2026](https://costbench.com/software/observability/grafana-cloud/) · [Grafana Cloud free plan](https://costbench.com/software/observability/grafana-cloud/free-plan/) · [Cloud vs self-hosted 2026](https://pickuma.com/for-dev/grafana-cloud-vs-self-hosted-2026/)
- Search: [Meilisearch pricing 2026](https://aiproductivity.ai/pricing/meilisearch/) · [Self-hosting Meilisearch](https://deployable.sh/apps/meilisearch/)
- FX: [USD→AUD (MTFX)](https://www.mtfxgroup.com/tools/historical-currency-exchange-rates/usd-to-aud-rate/) · [AUD→EUR (Wise)](https://wise.com/gb/currency-converter/aud-to-eur-rate/history)
