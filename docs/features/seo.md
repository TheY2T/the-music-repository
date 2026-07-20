# Feature: SEO — metadata, structured data & crawlability

- **Status:** shipped
- **Flag key:** none — always-on shell infrastructure (ADR 0039)

## Purpose

Make the public catalogue discoverable in search and shareable on social platforms: every indexable page
carries a unique title + description, a self-referential canonical, Open Graph / Twitter card, and (for
content) schema.org structured data — all in the **server** HTML. The full catalogue is exposed via
sitemaps; private pages are kept out of the index.

## How it works

### Metadata pipeline (the shell owns `<head>`)

`BaseLayout.astro` accepts SEO props and delegates assembly to `apps/web/src/lib/seo.ts`:

| Prop | Purpose |
|---|---|
| `title` (required) | `<title>` — brand-suffix with `pageTitle(text, siteName)` → `"X — Site"` |
| `description` | `<meta name="description">` + `og:description` |
| `image` | `og:image` (cover art); falls back to `/og-default.png` |
| `type` | `og:type` — `article` for content detail, else `website` |
| `noindex` | emits `<meta name="robots" content="noindex,nofollow">` |
| `jsonLd` | array of schema.org objects → `<script type="application/ld+json">` |
| `publishedTime` / `modifiedTime` | `article:*` OG timestamps |

`BaseLayout` **always** emits: canonical (self, per-locale), OG set (`og:type/title/description/url/
site_name/image` + `og:locale` + alternates), `twitter:card=summary_large_image`, and — when
`platform.i18n` is on — reciprocal `hreflang` alternates + `x-default`. `Organization` + `WebSite` JSON-LD
are site-wide.

`buildSeo()` computes the canonical/OG/robots/alternates. **Self-canonical per locale**: a `/zh` page
canonicalizes to its own `/zh` URL — never the English page.

### Content detail pages server-fetch their metadata

`catalogue/[slug].astro` and `collections/[slug].astro` fetch the item in frontmatter via
`@TheY2T/tmr-web-acl/server-content` (`fetchContentMeta` / `fetchCollectionMeta`) using the internal API
origin (`apiBaseUrl()`), then pass the real title/description/share-image + JSON-LD into `BaseLayout`. A
miss (404 or unreachable API) falls back to generic hub metadata. web-acl is the **only** package allowed
to name api-client (ADR 0037), so the fetch lives there.

### Structured data (`seo.ts` builders)

`organizationJsonLd` · `websiteJsonLd` (site-wide) · `breadcrumbJsonLd` · `articleJsonLd` ·
`musicCompositionJsonLd` (catalogue items) · `courseJsonLd` (collections). Only
Breadcrumb/Article/Course/Organization surface as Google rich results; WebSite/MusicComposition are entity
signals. `jsonLdScript()` escapes `<` so a value can't break out of the `<script>` block. **Do not build**
FAQ/HowTo/SearchAction/Course-info — those rich results are retired.

### Sitemaps + robots

SSR endpoint routes (the `@astrojs/sitemap` integration can't enumerate API-driven dynamic routes under
`output: 'server'`):

- `sitemap-index.xml.ts` → child sitemaps.
- `sitemap-static.xml.ts` → hubs + enabled `tools.*` routes (from the flag snapshot) + legal/about.
- `sitemap-catalogue.xml.ts` / `sitemap-collections.xml.ts` → slugs from the API.
- `robots.txt.ts` → allow all crawlers + `Sitemap:` line.

`src/lib/sitemap.ts` renders the `<urlset>`/`<sitemapindex>` (one `<loc>` per active locale; no
`priority`/`changefreq` — Google ignores them). hreflang is on the pages themselves, so the sitemap's job
is URL discovery.

### LLM ingestion — llms.txt + markdown negotiation

AI answer engines get two complementary surfaces, both generated from live content (ADR 0039):

- **`llms.txt.ts` / `llms-full.txt.ts`** — SSR routes following [llmstxt.org](https://llmstxt.org/):
  `# The Music Repository`, a `>` summary blockquote, then `##` sections (Catalogue, Collections, Tools,
  Pages) of `- [title](absolute-url): description`, with secondary/legal pages under a trailing
  `## Optional`. `llms-full.txt` repeats the structure with each item's `bodyMdx` (+ details/outcomes)
  inlined. Pure builders live in `src/lib/llms.ts`; live enumeration (reusing `enabledToolPaths` + the
  `@TheY2T/tmr-web-acl/server-content` fetchers) in `src/lib/llms-sources.ts`. Base-locale English;
  `llms-full.txt` fetches prose with bounded concurrency behind a short in-process cache.
- **`Accept: text/markdown` on every route** — `middleware.ts` calls `prefersMarkdown(accept)`; when true,
  content detail pages (`/catalogue/<slug>`, `/collections/<slug>`) return clean source `bodyMdx`
  (`contentPageMarkdown`), and any other route has its rendered `<main>` converted to markdown
  (`htmlToMarkdown`, `node-html-markdown`), falling back to the HTML on failure. Every negotiated response
  sets **`Vary: Accept`** so Cloudflare caches the HTML and markdown variants separately. `BaseLayout`
  wraps the page slot in the single `<main>` landmark that extraction targets.

`robots.txt.ts` carries a `# LLM index` comment pointing at `/llms.txt` alongside the `Sitemap:` line.

### noindex

Private surfaces pass `noindex` to `BaseLayout`: `admin/**` (incl. `admin/preview/**`), `me/**`,
`dashboard`, `settings`, `signin`, `upgrade*`, `classrooms*`, `drills/**`.

## Checklist — keeping SEO correct (see the `add-seo` skill)

- **New page** → pass `title` **and** `description` to `BaseLayout` (static copy via a `seo.*` i18n key).
- **New content type / detail route** → server-fetch its metadata, add a JSON-LD builder, and add a
  sitemap child (or extend an existing one).
- **Private/duplicate page** → pass `noindex`.
- **Never** hardcode the production domain — it comes from `PUBLIC_SITE_URL` (Astro `site`).

## Operational

`PUBLIC_SITE_URL` **must** be set per environment — every absolute URL (canonical, OG, hreflang, sitemap,
JSON-LD) derives from it. It is read by `astro.config.mjs` at **build time** (`site:
process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321'`), so it must be present during `pnpm build`, not
only at runtime. Defaults to `http://localhost:4321` for dev.

## Tests

- **Unit:** `apps/web/src/lib/seo.test.ts` (canonical self/per-locale, OG locale mapping, robots, JSON-LD
  shape + escaping); `packages/web-acl/src/server-content.test.ts` (DTO→meta mapping, null on 404).
- **Unit (LLM):** `apps/web/src/lib/llms.test.ts` (index/full/item markdown shape — H1, blockquote,
  `## Optional`, absolute URLs); `apps/web/src/lib/markdown.test.ts` (`prefersMarkdown` q-value ranking,
  `htmlToMarkdown` `<main>` extraction).
- **E2E:** `apps/web/e2e/seo.spec.ts` (mock mode) — robots.txt (incl. the llms.txt pointer), sitemap index +
  children, home + catalogue detail head metadata + JSON-LD, `noindex` on private pages, `/llms.txt` +
  `/llms-full.txt` structure, and `Accept: text/markdown` returning markdown + `Vary: Accept` (while
  `Accept: text/html` still returns HTML). Uses the `mock-song` SSR fixture.
- **Verify live:** View Source on a catalogue item — confirm `<title>` = item title, a description, a
  self-canonical, OG tags, and Article/Breadcrumb JSON-LD are in the **server** HTML; hit
  `/sitemap-index.xml` and `/robots.txt`; switch to `/zh/...` and confirm the canonical points at the
  `/zh` URL. Validate a page in Google's Rich Results Test.
