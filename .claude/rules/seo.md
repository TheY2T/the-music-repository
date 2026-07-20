---
paths:
  - "apps/web/src/layouts/BaseLayout.astro"
  - "apps/web/src/lib/seo.ts"
  - "apps/web/src/lib/sitemap.ts"
  - "apps/web/src/pages/**"
  - "apps/web/src/pages/sitemap-*.xml.ts"
  - "apps/web/src/pages/robots.txt.ts"
  - "packages/web-acl/src/server-content.ts"
---

# SEO (ADR 0039, `docs/features/seo.md`)

SEO is **always-on shell infrastructure** — no feature flag. `BaseLayout.astro` owns `<head>`; the
metadata plumbing is in `apps/web/src/lib/seo.ts`. Follow the **`add-seo`** skill.

- **Every indexable page sets `title` AND `description`** on `BaseLayout`. Static copy uses a `seo.*` i18n
  key (add once to `@TheY2T/tmr-i18n-locales`, then CMS-editable — rebuild the i18n packages so
  `MessageKey` picks it up); content pages reuse the item `summary`. Brand-suffix titles with
  `pageTitle(text, siteName)`.
- **Canonical is self-referential and per-locale.** `BaseLayout` emits it from `Astro.site` +
  `splitLocalePath`. **Never** canonicalize a `/zh` page back to English (collapses it out of the index,
  defeats hreflang).
- **Content detail pages server-fetch their metadata** in frontmatter via
  `@TheY2T/tmr-web-acl/server-content` (`fetchContentMeta`/`fetchCollectionMeta`, `apiBaseUrl()`) — never
  leave the crawler-visible `<head>` with a client-rendered title. web-acl is the only package allowed to
  name api-client (ADR 0037).
- **Private/duplicate surfaces pass `noindex`** (crawlable, not disallowed): `admin/**`, `me/**`,
  `dashboard`, `settings`, `signin`, `upgrade*`, `classrooms*`, `drills/**`.
- **Structured data via the `seo.ts` builders** (Organization/WebSite/Breadcrumb/Article/Course/
  MusicComposition). A new content type gets a JSON-LD builder + a sitemap child. Serialize with
  `jsonLdScript()` (escapes `<`).
- **Do NOT build** (retired/ignored 2025–2026): `WebSite`+`SearchAction` sitelinks searchbox, `FAQPage`,
  `HowTo`, Course-**info** rich fields, `rel=next/prev` for Google, `<priority>`/`<changefreq>`.
- **LLM ingestion** (llmstxt.org): `/llms.txt` (index) + `/llms-full.txt` (inlined prose) are SSR routes
  generated from live content (`src/lib/llms.ts` builders + `llms-sources.ts` fetchers). Every route also
  answers `Accept: text/markdown` with a markdown rendering — content detail pages serve clean source
  `bodyMdx`, other routes convert their `<main>` (`src/lib/markdown.ts`); responses set `Vary: Accept` so
  edge caches (Cloudflare) keep the HTML and markdown variants separate. robots.txt carries a
  `# LLM index` pointer.
- **Sitemaps are SSR routes** (`sitemap-*.xml.ts` via `src/lib/sitemap.ts`), not `@astrojs/sitemap`.
  Exclude private/auth-gated routes. **robots.txt** allows all crawlers + the `Sitemap:` line.
- **`PUBLIC_SITE_URL` must be set per environment at BUILD time** — `astro.config.mjs` reads it into
  `site` during `pnpm build`; all absolute URLs derive from it (defaults to `localhost:4321`).
- **Test it** (Definition of Done): `seo.test.ts` + `server-content.test.ts` (unit) and `e2e/seo.spec.ts`
  (E2E). Kill any stray host `astro dev` on :4321 before running E2E, or Playwright reuses it (no MSW) and
  SSR-fetch tests fall back.
