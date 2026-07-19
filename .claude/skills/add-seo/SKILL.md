---
name: add-seo
description: Make a page or content type in The Music Repository search-optimized — set the title/description/canonical/Open Graph/JSON-LD via BaseLayout + seo.ts, server-fetch metadata for detail pages, mark private pages noindex, and add sitemap entries. Use when adding or changing any web page, content type, or route, or when auditing/improving SEO. Always-on infra (no flag). See docs/features/seo.md + ADR 0039.
---

# add-seo

SEO is **always-on shell infrastructure** (no flag). `BaseLayout.astro` owns `<head>`; helpers live in
`apps/web/src/lib/seo.ts`. Absolute URLs come from Astro's `site` (`PUBLIC_SITE_URL`). Full reference:
`docs/features/seo.md` · rule `.claude/rules/seo.md` · ADR 0039.

## A. A new (or changed) page

1. Pass **both** `title` and `description` to `BaseLayout`:
   ```astro
   <BaseLayout title={pageTitle(t(locale, 'x.title'), t(locale, 'site.name'))}
               description={t(locale, 'seo.x.description')}>
   ```
   - Add the `seo.x.description` key to `packages/i18n-locales/src/en.json` (+ `zh-Hans.json`), then
     **rebuild** `@TheY2T/tmr-i18n-locales` + `@TheY2T/tmr-i18n` so `MessageKey` includes it
     (`pnpm --filter @TheY2T/tmr-i18n-locales build && pnpm --filter @TheY2T/tmr-i18n build`).
   - `BaseLayout` auto-emits the self-canonical, OG, Twitter card, and hreflang — nothing else to do.
2. **Private/duplicate page?** add the `noindex` prop (`<BaseLayout noindex …>`).
3. **Public and indexable?** add it to `sitemap-static.xml.ts` (or the relevant child).

## B. A content **detail** page (server-fetch its metadata)

Never leave the crawler-visible `<head>` with a client-rendered title. In the page frontmatter:

```astro
import { apiBaseUrl } from '@/lib/api-base';
import { articleJsonLd, breadcrumbJsonLd, pageTitle } from '@/lib/seo';
import { fetchContentMeta } from '@TheY2T/tmr-web-acl/server-content';

const meta = await fetchContentMeta(slug, {
  apiBaseUrl: apiBaseUrl(), locale, cookie: Astro.request.headers.get('cookie') ?? undefined,
});
const title = meta ? pageTitle(meta.title, siteName) : t(locale, 'x.fallbackTitle');
const jsonLd = meta ? [ breadcrumbJsonLd([...]), articleJsonLd({...}) ] : undefined;
```

Then `<BaseLayout title={title} description={meta?.summary ?? fallback} image={meta?.imageUrl}
type="article" jsonLd={jsonLd}>`. Add a `fetch*Meta` helper to `packages/web-acl/src/server-content.ts`
for a new entity (only web-acl may name api-client — ADR 0037).

## C. A new content type (structured data + sitemap)

1. Add a JSON-LD builder to `seo.ts` (return a plain object; serialize via `jsonLdScript`). Prefer types
   that still produce Google rich results — **Breadcrumb, Article, Course, Organization**. For music,
   `MusicComposition` is an entity signal.
   **Do NOT build:** FAQ / HowTo / `WebSite`+`SearchAction` searchbox / Course-info — all retired.
2. Add a sitemap child route (`src/pages/sitemap-<type>.xml.ts`) that enumerates slugs via a
   `list*Slugs` helper in `server-content.ts`, and reference it from `sitemap-index.xml.ts`.

## D. Verify (Definition of Done)

- Unit: extend `apps/web/src/lib/seo.test.ts` / `packages/web-acl/src/server-content.test.ts`.
- E2E: extend `apps/web/e2e/seo.spec.ts` (assert head tags via `page.locator('meta[...]')` + JSON-LD).
  **Kill any stray host `astro dev` on :4321 first** (`lsof -ti tcp:4321 | xargs kill`) or Playwright
  reuses it without MSW and SSR-fetch assertions fall back to generic metadata.
- Live: View Source on the page — the `<title>`, description, canonical, OG, and JSON-LD must be in the
  **server** HTML (not only after JS). Validate with Google's Rich Results Test.
