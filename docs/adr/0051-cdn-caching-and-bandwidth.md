# ADR 0051 — CDN caching & origin bandwidth

- **Status:** Accepted
- **Context:** The API (NestJS) and web app (Astro SSR) run as Docker web services on Render behind
  Cloudflare (ADR 0049). Before this decision the origin emitted **uncompressed** responses and set **no
  `Cache-Control`** on almost anything, so Cloudflare treated every response as `DYNAMIC` — every request
  reached Render and paid full egress. The two endpoints that did set headers used `max-age=0,
  must-revalidate` (no shared-cache window), and the heaviest response — `GET /media?key=` (DB-backed
  bytes) — was uncached. The self-hosted `/font` (4 MB) and `/soundfont` (87 MB) assets had no long-lived
  caching. Render bills **outbound bandwidth** (origin→edge egress) per service; reducing it is the goal.
- **Decision:**
  - **Origin compression.** The API applies `compression()` middleware (`apps/api/src/main.ts`). The web
    app switches the `@astrojs/node` adapter to **`middleware` mode** and runs a small production server
    (`apps/web/server.mjs`) that wraps the Astro SSR handler with `compression()` and serves built client
    assets with `sirv`. gzip/brotli now leaves the origin, shrinking the billed egress leg. (Cloudflare
    still compresses edge→client; that leg was never the origin's cost.)
  - **Immutable static caching.** `server.mjs` sets `Cache-Control: public, max-age=31536000, immutable`
    on content-hashed `/_astro/*` and on the version-pinned `/font/*` + `/soundfont/*` assets (they change
    only when the pinned alphaTab/soundfont versions bump). Other client files get a modest TTL.
  - **Public-read cache headers.** Public, viewer-independent API GETs carry `public, s-maxage=…,
    stale-while-revalidate=…` (`apps/api/src/http/cache-control.ts`, applied with `@Header`). The two
    versioned ETag endpoints (feature-flag snapshot, i18n catalogue) keep their conditional-GET/304 and
    gain a short `s-maxage` + `swr`. `GET /media` gains `ETag`/`Last-Modified` validators + a moderate TTL
    (a stored key's bytes change only on re-upload) so repeat fetches are cheap 304s.
  - **`no-store` by default for HTML.** The web middleware sets `private, no-store` on every SSR response
    **except** anonymous GETs of public pages, which get `public, max-age=0, s-maxage=60,
    stale-while-revalidate=600` + `Vary: Cookie` (`apps/web/src/lib/http-cache.ts`). Authenticated
    requests, private routes (`/admin`, `/account`, `/dashboard`, auth pages), and non-200s are never
    shared. This is the correctness rule: personalized/flag/locale-variant markup must never enter a shared
    cache.
  - **Cloudflare activation.** Origin `s-maxage` alone does not make Cloudflare cache JSON/media — the zone
    needs **Cache Rules** marking those responses eligible, an **auth-cookie bypass** rule, **Smart Tiered
    Cache**, and Brotli. These live in the Cloudflare dashboard (outside the repo); the exact rules and
    ready-to-run API payload are recorded in the deploy runbook.
- **Consequences:**
  - Caching is **always-on infrastructure**, no feature flag (like SEO, ADR 0039).
  - Correctness depends on the `no-store` default + the Cloudflare auth-cookie bypass rule: an anonymous
    response is cacheable precisely because a signed-in request carries the Better Auth cookie and bypasses
    the edge cache. Both must stay in place.
  - The web app no longer boots `dist/server/entry.mjs` directly — production runs `server.mjs`
    (Dockerfile `CMD`), and `astro preview` maps to it. Local `astro dev` is unaffected.
  - **Render billing impact:** compression cuts the size of every origin→edge response (JSON/HTML commonly
    60–80% smaller with brotli); edge cache hits remove origin egress entirely for cacheable public reads
    and, post-launch, for the multi-MB font/soundfont assets (fetched ~once per PoP per version instead of
    per user). Render bills compute per **instance-hour**, not per request, so caching doesn't lower the
    baseline — but it cuts per-request CPU/DB load, deferring the need to scale up. In the current
    Access-gated dev env traffic is developer-only, so the near-term dollar saving is small; the value is
    the foundation that pays off at public launch. Confirm current bandwidth allowances/overage against
    Render's pricing for the active plan before quoting figures.
- **Cloudflare state:** the three Cache Rules (cache public API GETs, bypass on the Better Auth cookie,
  cache web static assets) are **applied** on the zone (`http_request_cache_settings` phase) and verified
  (`cf-cache-status` MISS→HIT anonymous; not-cached with an auth cookie). Brotli is already active at the
  edge. **Smart Tiered Cache** and an explicit Brotli toggle need **Zone Settings → Edit** (a paid plan for
  Tiered Cache) and were not enabled. Rules + payload are in the runbook.
