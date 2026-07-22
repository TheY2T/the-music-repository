# Feature: CDN caching & bandwidth

- **Phase:** infra · **Status:** shipped
- **Flag key:** none — always-on infrastructure (like SEO, ADR 0039)

## Purpose

Reduce origin bandwidth and Render cost by compressing what the origin emits and letting Cloudflare and
browsers cache what is safe to cache — without ever serving a personalized, flag-, or locale-variant
response from a shared cache. See [ADR 0051](../adr/0051-cdn-caching-and-bandwidth.md).

## How it works

**Origin compression.** The API adds `compression()` middleware (`apps/api/src/main.ts`). The web app runs
the `@astrojs/node` adapter in **`middleware` mode** behind a small production server
(`apps/web/server.mjs`) that wraps the SSR handler with `compression()` and serves built client assets via
`sirv`. gzip/brotli therefore leaves the origin, shrinking the Render→Cloudflare egress leg.

**Static assets.** `server.mjs` sets `public, max-age=31536000, immutable` on content-hashed `/_astro/*`
and on the version-pinned `/font/*` + `/soundfont/*` assets; other client files get `max-age=3600`.

**HTML (web SSR).** `apps/web/src/lib/http-cache.ts` computes the policy; `middleware.ts` applies it:

| Request | `Cache-Control` |
|---|---|
| Anonymous GET, public page, 200 | `public, max-age=0, s-maxage=60, stale-while-revalidate=600` + `Vary: Cookie` |
| Authenticated, or `/admin`·`/account`·`/dashboard`·auth pages, or non-GET/non-200 | `private, no-store` |

Defaulting to `no-store` keeps personalized markup out of any shared cache; the anonymous variant is safe
because a signed-in request carries the Better Auth cookie and is bypassed at the edge (see below).

**API reads.** Policies live in `apps/api/src/http/cache-control.ts`, applied with Nest's `@Header`:

| Endpoints | Policy |
|---|---|
| `GET /catalogue/items`, `/collections`, `/collections/search` | `CACHE_PUBLIC_SHORT` (`s-maxage=120, swr=600`) |
| `GET /catalogue/items/:slug(/related)`, `/collections/:slug`, `/collections/by-content/:slug`, `/help-topics*`, `/faq-entries*`, `/i18n/version`, `/i18n/locales`, `/feature-flags/environments` | `CACHE_PUBLIC_MEDIUM` (`s-maxage=600, swr=3600`) |
| `GET /collections/:slug/progress` (per-viewer) | `CACHE_PRIVATE` (`no-store`) |
| `GET /feature-flags/snapshot/:env`, `/i18n/catalogue/:locale` | ETag/304 + `max-age=0, s-maxage=30, swr=60` |
| `GET /media?key=` | `ETag`/`Last-Modified` + `public, max-age=3600, stale-while-revalidate=86400` |

## Cloudflare activation (dashboard-side)

Origin `s-maxage` alone will **not** make Cloudflare cache JSON/media — the zone needs Cache Rules. See the
deploy runbook ([`docs/runbooks/deploy-from-scratch.md`](../runbooks/deploy-from-scratch.md), "CDN caching")
for the exact rules and a ready-to-run API payload:

1. **Cache public API GETs** on `api.themusicrepository.com` (respect origin TTL, serve stale while
   revalidating).
2. **Bypass** cache when the Better Auth cookie is present (never cache a signed-in response).
3. **Cache web static assets** (`/_astro`, `/font`, `/soundfont`) — takes effect once the Access gate is
   removed at public launch.
4. Enable **Smart Tiered Cache** and confirm **Brotli**.

## Render billing impact

Compression cuts the size of every origin→edge response; edge cache hits remove origin egress entirely for
cacheable reads (and, post-launch, the multi-MB font/soundfont assets). Render bills compute per
instance-hour (not per request), so caching lowers per-request CPU/DB load — deferring scale-up — rather
than the baseline. Confirm current bandwidth allowances/overage against Render's pricing for the active
plan before quoting numbers.

## Tests

- **API unit** — `catalogue/media.controller.test.ts` (Cache-Control/ETag/Last-Modified + 304 on
  `If-None-Match`/`If-Modified-Since`); `help/help.controller.test.ts` asserts the `@Header` cache policy
  is emitted over HTTP (Supertest).
- **API integration** — `postgres-media-library.integration.test.ts` asserts `getObject` returns the
  `bytes`/`updatedAt` validators.
- **API unit (caching)** — `feature-flags/feature-flags.controller.test.ts` +
  `i18n/i18n.controller.test.ts` assert the versioned ETag, the short shared-cache window, and the 304 on
  a matching `If-None-Match`.
- **Web unit** — `lib/http-cache.test.ts` (shared vs `no-store` decisions, private-path matching);
  `middleware.test.ts` asserts the header is applied on the response (anonymous shared + `Vary: Cookie`,
  private route `no-store`, signed-in `no-store`).
- **Web E2E** — `e2e/caching.spec.ts` runs against the production server (`server.mjs`) and asserts
  immutable static headers, the anonymous-page shared policy, and `no-store` on a private route.
- **Manual verify** — `curl -I` the origin for `Content-Encoding` + `Cache-Control` (see runbook); after
  the Cloudflare rules, confirm `cf-cache-status: MISS → HIT` on a warmed public API path and that a
  `better-auth` cookie is not served from cache.
