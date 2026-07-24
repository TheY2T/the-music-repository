# Runbook: Deploy the app on a single Hetzner VPS (Cloudflare Tunnel + R2 + Meilisearch + observability)

A replayable record of standing up **The Music Repository** on **one Hetzner box** running
`infra/podman/compose.prod.yaml`, fronted by **Cloudflare Tunnel**, with media on **Cloudflare R2** and
search on **Meilisearch**. Architecture rationale is in
[ADR 0055](../adr/0055-single-vps-hetzner-r2-meilisearch-observability.md) and
[`docs/features/deployment.md`](../features/deployment.md); this is the *procedure*. It supersedes the
Render runbook (`deploy-from-scratch.md`).

> **Read [Gotchas](#gotchas) first.** The `PUBLIC_*` build-arg baking and the Meilisearch-before-seed
> ordering are the two that bite on the first run.

## What you get

- One Hetzner **CPX31** (4 vCPU / 8 GB / 160 GB NVMe, 20 TB traffic, **Falkenstein/EU**) running
  Postgres + Meilisearch + API + web + `cloudflared`. No Hetzner Volume needed — the 160 GB local NVMe
  holds the Docker volumes; media lives in R2.
- Observability (OTel Collector + Tempo/Loki/Prometheus/Grafana) is an **opt-in `observability`
  profile**, memory-capped to run alongside the app on 8 GB.
- Ingress only through Cloudflare Tunnel — **no inbound ports open**, origin IP hidden.
- Media served from `media.themusicrepository.com` (R2, zero origin egress).

## Reference identifiers (dev)

- Cloudflare account `3e8ce8645fbc7d7e8890f05e462533b0`; zone `themusicrepository.com`
  `d5b3cb2ab942280b1eda955f0b6b5d9a`; Access team `themusicrepository.cloudflareaccess.com`; existing
  Access app `f038e96f-e433-4c01-bb0c-eb4f57751d24` (apex + www).

## 1. Provision the box

1. Create a Hetzner Cloud **CPX31** in **Falkenstein (EU)**, Ubuntu 24.04+ (26.04 LTS works), with your
   SSH key. No Volume add-on. (EU includes 20 TB traffic; Cloudflare's edge masks origin latency.)
2. Harden + install Docker:
   ```bash
   ssh root@<ip>
   apt-get update && apt-get -y upgrade
   curl -fsSL https://get.docker.com | sh        # Docker Engine + compose plugin
   ufw default deny incoming && ufw allow OpenSSH && ufw enable   # tunnel needs no inbound ports
   git clone https://github.com/TheY2T/the-music-repository.git /opt/tmr
   ```
   The tunnel makes only **outbound** connections, so the firewall can deny all inbound except SSH.

## 2. The `.env` file (secrets)

Create `/opt/tmr/.env` (chmod 600) — `compose.prod.yaml` reads it. Values marked `?set in .env`
in the compose are required.

```bash
# Postgres
POSTGRES_USER=tmr
POSTGRES_PASSWORD=<generate>
POSTGRES_DB=tmr
APP_ENV=prod
# Auth (generate a 32+ char secret: openssl rand -base64 32)
BETTER_AUTH_SECRET=<generate>
BETTER_AUTH_URL=https://api.themusicrepository.com
AUTH_COOKIE_DOMAIN=.themusicrepository.com
TRUSTED_ORIGINS=https://themusicrepository.com,https://www.themusicrepository.com,https://api.themusicrepository.com
WEB_BASE_URL=https://themusicrepository.com
# Web build args (baked into the client bundle)
PUBLIC_SITE_URL=https://themusicrepository.com
PUBLIC_API_BASE_URL=https://api.themusicrepository.com
# Meilisearch
MEILI_MASTER_KEY=<generate>
# Cloudflare R2 (from step 3)
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<r2 token key id>
R2_SECRET_ACCESS_KEY=<r2 token secret>
R2_BUCKET=tmr-media
R2_PUBLIC_URL=https://media.themusicrepository.com
# Mail (Resend) — carry over from the Render dev env group
SMTP_URL=smtps://resend:<key>@smtp.resend.com:465
MAIL_FROM=The Music Repository <no-reply@themusicrepository.com>
# Tunnel (from step 4)
TUNNEL_TOKEN=<from cloudflared tunnel token>
# Observability (only when running --profile observability): a Grafana admin password, and point the
# API's exporter at the collector. Leave OTEL_EXPORTER_OTLP_ENDPOINT unset to run without observability.
GF_SECURITY_ADMIN_PASSWORD=<generate>
# OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
# Social providers, Turnstile, etc. — carry over as needed
```

## 3. Cloudflare R2 (media)

1. **Create the bucket** `tmr-media` (R2 → Create bucket).
2. **Custom domain:** bucket → Settings → Public access → **Connect a domain** →
   `media.themusicrepository.com`. Cloudflare adds the proxied DNS record and serves public reads over
   HTTPS. (Reads are public; nothing sensitive lives here.)
3. **CORS** (bucket → Settings → CORS policy) so the CMS can upload via the presigned PUT:
   ```json
   [{ "AllowedOrigins": ["https://themusicrepository.com"],
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["*"] }]
   ```
4. **API token:** R2 → Manage API tokens → create an **Object Read & Write** token scoped to the
   bucket. Put the Access Key ID / Secret and your account id into `.env` (`R2_*`).

> The `cloudflare-api` MCP can create the bucket + DNS where the token allows; otherwise use the
> dashboard. The S3 adapter uses `region: 'auto'` and the R2 S3 endpoint
> `https://<account>.r2.cloudflarestorage.com` (derived from `R2_ACCOUNT_ID`).

## 4. Cloudflare Tunnel (ingress)

1. Zero Trust → Networks → **Tunnels** → Create a tunnel (`tmr-prod`), **Cloudflared** connector.
   Copy the **token** → `.env` `TUNNEL_TOKEN`. (The `cloudflared` container runs the connector — do not
   install it on the host.)
2. Add **public hostnames** on the tunnel (Service = the compose service over HTTP):
   | Hostname | Service |
   |---|---|
   | `themusicrepository.com` | `http://web:4321` |
   | `www.themusicrepository.com` | `http://web:4321` |
   | `api.themusicrepository.com` | `http://api:3000` |
   | `grafana.themusicrepository.com` (only if running observability) | `http://grafana:3000` |
   Cloudflare auto-creates the proxied CNAMEs to `<tunnel-id>.cfargotunnel.com`.
3. **Access:** keep apex + www on the existing Access application (add `grafana.` too **only** when you
   run the observability profile); leave `api.` **ungated** (gating it breaks CORS/OAuth). SSL/TLS **Full**.

## 5. Deploy

```bash
cd /opt/tmr
docker compose -f infra/podman/compose.prod.yaml up -d --build   # or: pnpm prod:up
# with self-hosted observability (after setting GF_SECURITY_ADMIN_PASSWORD +
# OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317 in .env):
#   docker compose -f infra/podman/compose.prod.yaml --profile observability up -d --build
```
`init` waits for Meilisearch `/health`, applies migrations, seeds auth + content, builds the search
index, and — because R2 is configured — writes seed media into R2. `api` then starts and `cloudflared`
connects.

## 6. Migrate existing media (only when moving an existing database)

If you restore the current Render Postgres dump (which holds media bytes in `media_objects`), push
those bytes to R2 once:
```bash
docker compose -f infra/podman/compose.prod.yaml run --rm \
  -e ... api pnpm --filter @TheY2T/tmr-api db:migrate-media
```
Idempotent — safe to re-run. If you instead start from a fresh seed, skip this (the seed already wrote
media to R2).

## 7. DNS cutover

Once the tunnel hostnames resolve and the box is healthy, **remove the old Render custom domains and
the apex/`www`/`api` CNAMEs pointing at `*.onrender.com`** — the tunnel CNAMEs replace them. Decommission
the Render services afterward.

## 8. Verify

```bash
curl -sf https://api.themusicrepository.com/health           # {"status":"ok",...}
curl -s "https://api.themusicrepository.com/catalogue?q=mozrt" | jq '.items[0].title'  # typo-tolerant hit
curl -sI https://media.themusicrepository.com/<a-known-key>  # 200 + cf-cache-status
```
- Browse the catalogue; confirm facets + typo tolerance.
- Sign in (Access PIN), open the CMS, upload media → it lands in R2 and renders from
  `media.themusicrepository.com`.
- `grafana.themusicrepository.com` loads only through Access and shows API traces (Tempo), logs (Loki),
  metrics (Prometheus).

## 9. Backups & ops

- **Postgres:** schedule `pg_dump` off-box (e.g. nightly to R2/B2). This is the only stateful data that
  isn't reproducible from the repo (media is in R2; the Meili index rebuilds from `db:seed`/reindex).
- **Meilisearch/observability** volumes are rebuildable; snapshot the box or the named volumes if you
  want faster recovery.
- **Image currency:** the compose pins image tags — bump them deliberately and redeploy.

## Local verification (before touching the box)

`pnpm app:up` runs the full stack — Postgres + Meilisearch + MinIO (an S3-compatible R2 stand-in) +
API + web — with the search/media env pre-wired and the MinIO bucket created + made public
automatically (`minio-setup`). Browse `http://localhost:4321`, confirm typo-tolerant search + facet
counts, and read media from `http://localhost:9000/tmr-media/...`.

> MinIO console: `http://localhost:9001` (minioadmin/minioadmin). Browser-side CMS uploads use a
> presigned PUT signed for the in-network `minio:9000` host, so they resolve from inside the compose
> network / server-side seed; against a real R2 endpoint they resolve from the browser too.

## Gotchas

- **`PUBLIC_*` are build-time.** Changing `PUBLIC_SITE_URL`/`PUBLIC_API_BASE_URL` requires
  `--build` (they're baked into the client bundle), not just an env change.
- **Meilisearch must be up before the seed.** `init` blocks on `/health`; don't remove that wait — the
  seed's reindex writes to Meilisearch.
- **Tunnel = no inbound ports.** Do not publish service ports or open the firewall; if a hostname 502s,
  check the tunnel's public-hostname service points at the right `http://<service>:<port>`.
- **Keep `api.` ungated by Access** — gating it breaks CORS preflight and OAuth callbacks.
- **Generate a real `BETTER_AUTH_SECRET`.** There is no Render `generateValue` equivalent on the box.
- **Grafana is public-facing via the tunnel** — the compose disables anonymous access and sets an admin
  password; keep it behind Access too.
