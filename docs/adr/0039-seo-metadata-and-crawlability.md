# ADR 0039 — SEO metadata, structured data & crawlability

- **Status:** accepted
- **Date:** 2026-07

## Context

The site is a public content catalogue (scores, lessons, collections, interactive tools) whose value
depends on being discoverable in search and shared cleanly on social platforms. It shipped only a thin
SEO baseline: a per-page `<title>`, `<html lang>`, flag-gated `hreflang` alternates, and one
`Organization` JSON-LD block. Everything else search engines rely on was absent, and one gap was actively
harmful:

- `BaseLayout`'s props were just `{ title }` — no page could set a meta description, canonical, Open
  Graph/Twitter card, or robots directive.
- Catalogue and collection **detail** pages fetched their content client-side, so the server HTML shipped
  a generic hardcoded title and no description — crawlers saw an empty shell for the exact long-tail
  pages meant to earn traffic.
- No sitemap and no `robots.txt`. Admin/account/auth pages (including draft previews) were indexable.
- `PUBLIC_SITE_URL` defaulted to `localhost`, so absolute URLs would break if unset in production.

2025–2026 search guidance also retired several rich-result types, which shapes what is worth building.

## Decision

1. **SEO is always-on shell infrastructure — not flag-gated.** Like `charset`/`viewport`, correct
   metadata must be present on every render. There is no `platform.seo` flag.

2. **A per-page metadata pipeline in the shell.** `BaseLayout.astro` owns `<head>`, so metadata assembly
   lives in `apps/web/src/lib/seo.ts` (pure helpers) and `BaseLayout` props: `title`, `description`,
   `image`, `type`, `noindex`, `jsonLd`, `publishedTime`, `modifiedTime`. `BaseLayout` always emits a
   self-referential canonical, Open Graph tags, `twitter:card`, and (when i18n is on) reciprocal
   `hreflang` alternates.

3. **Detail pages server-fetch their metadata.** `catalogue/[slug]` and `collections/[slug]` fetch the
   item in Astro frontmatter via `@TheY2T/tmr-web-acl/server-content` (the ACL boundary — only web-acl
   names api-client) and feed the real title/description/share-image/JSON-LD into `<head>`. A miss falls
   back to generic hub metadata rather than failing the render.

4. **Structured data via JSON-LD builders** in `seo.ts`: `Organization` + `WebSite` (site-wide),
   `BreadcrumbList` + `Article` + `MusicComposition` (catalogue items), `Course` + `BreadcrumbList`
   (collections). Breadcrumb/Article/Course/Organization can surface as Google rich results;
   WebSite/MusicComposition are entity signals.

5. **Sitemaps are SSR endpoint routes**, not the `@astrojs/sitemap` integration (which can't enumerate
   API-driven dynamic routes under `output: 'server'`). A `sitemap-index.xml` points at type-segmented
   children (`sitemap-static`/`-catalogue`/`-collections`); the catalogue/collection children enumerate
   slugs from the API. Each canonical path contributes one `<loc>` per active locale.

6. **`robots.txt` is a route** that allows all crawlers (search and AI answer engines, to maximize
   discovery and citation) and references the sitemap index. Private surfaces are kept out of the index
   with a `noindex` **meta tag** (crawlable, not disallowed) — a robots.txt `Disallow` would prevent
   crawlers from ever seeing the `noindex`.

7. **Self-canonical per locale.** Each `/zh` page canonicalizes to its own `/zh` URL — never back to the
   English page (that would collapse it out of the index and defeat hreflang).

8. **Localized SEO copy** for static pages uses `seo.*` i18n keys (`@TheY2T/tmr-i18n-locales`); content
   pages reuse the already-translatable `summary`.

### Explicitly rejected (retired or ignored in 2025–2026)

`WebSite` + `SearchAction` **sitelinks searchbox** (removed Nov 2024), `FAQPage` (retiring May 2026) and
`HowTo` (dead) rich results, Course-**info** rich fields (deprecated Jul 2025), `rel="next"/"prev"` for
Google (paginated pages self-canonicalize instead), and `<priority>`/`<changefreq>` in sitemaps
(ignored). `llms.txt` is not adopted (no confirmed benefit).

## Consequences

- **Positive:** every indexable page carries a title, description, canonical, OG/Twitter card, and (for
  content) rich structured data in the **server** HTML; the full catalogue is discoverable via sitemaps;
  private pages stay out of the index; share previews render with a branded default image or item cover
  art. Future pages inherit correctness by passing `title` + `description` to `BaseLayout`.
- **Operational:** `PUBLIC_SITE_URL` **must** be set per environment — every absolute URL (canonical, OG,
  hreflang, sitemap, JSON-LD) derives from Astro's `site`.
- **Deferred (backlog):** `astro:assets` image-optimization pipeline; dynamically-generated per-page OG
  cards; SSR-seeding the detail islands' first paint (Googlebot renders the client JS, so head metadata is
  the dominant win); per-locale Meilisearch index so localized catalogue-list/search metadata is
  translated; AI-crawler blocking (all are allowed for now).

## References

- Feature doc: `docs/features/seo.md` · Rule: `.claude/rules/seo.md` · Skill: `add-seo`.
- Supersedes the ad-hoc `Organization` JSON-LD introduced in ADR 0038 (now built in `seo.ts`).
