import { expect, test } from './fixtures';

/** Parse every JSON-LD block on the current page into `@type → object`. */
async function jsonLdByType(
  page: import('@playwright/test').Page,
): Promise<Record<string, unknown>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const byType: Record<string, unknown> = {};
  for (const raw of blocks) {
    const parsed = JSON.parse(raw) as { '@type'?: string };
    if (parsed['@type']) byType[parsed['@type']] = parsed;
  }
  return byType;
}

test.describe('SEO — crawlability', () => {
  test('robots.txt allows all crawlers and points at the sitemap index', async ({ page }) => {
    const res = await page.request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toMatch(/Sitemap:\s+https?:\/\/\S+\/sitemap-index\.xml/);
  });

  test('sitemap index references the type-segmented child sitemaps', async ({ page }) => {
    const res = await page.request.get('/sitemap-index.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
    const xml = await res.text();
    expect(xml).toContain('<sitemapindex');
    for (const child of [
      'sitemap-static.xml',
      'sitemap-catalogue.xml',
      'sitemap-collections.xml',
    ]) {
      expect(xml).toContain(child);
    }
  });

  test('static sitemap lists the public hubs', async ({ page }) => {
    const xml = await (await page.request.get('/sitemap-static.xml')).text();
    expect(xml).toContain('<urlset');
    expect(xml).toMatch(/<loc>[^<]*\/about<\/loc>/);
    expect(xml).toMatch(/<loc>[^<]*\/tools<\/loc>/);
  });

  test('catalogue sitemap enumerates published items', async ({ page }) => {
    const xml = await (await page.request.get('/sitemap-catalogue.xml')).text();
    expect(xml).toContain('/catalogue/mock-song');
  });

  test('robots.txt references the llms.txt index', async ({ page }) => {
    const body = await (await page.request.get('/robots.txt')).text();
    expect(body).toMatch(/# LLM index[^\n]*https?:\/\/\S+\/llms\.txt/);
  });
});

test.describe('SEO — LLM ingestion', () => {
  test('llms.txt is a valid llmstxt.org index with absolute links', async ({ page }) => {
    const res = await page.request.get('/llms.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('# The Music Repository');
    expect(body).toMatch(/^>/m); // blockquote summary
    expect(body).toContain('## Catalogue');
    expect(body).toMatch(/- \[[^\]]+\]\(https?:\/\/\S+\/catalogue\/mock-song\)/);
  });

  test('llms-full.txt inlines catalogue prose', async ({ page }) => {
    const res = await page.request.get('/llms-full.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('# The Music Repository');
    expect(body).toContain('Mock Song');
  });

  test('Accept: text/markdown returns markdown for a content page with Vary: Accept', async ({
    page,
  }) => {
    const res = await page.request.get('/catalogue/mock-song', {
      headers: { Accept: 'text/markdown' },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/markdown');
    expect(res.headers().vary).toContain('Accept');
    const body = await res.text();
    expect(body).toContain('# Mock Song');
  });

  test('Accept: text/html still returns HTML for the same content page', async ({ page }) => {
    const res = await page.request.get('/catalogue/mock-song', {
      headers: { Accept: 'text/html' },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
  });
});

test.describe('SEO — page metadata', () => {
  test('home page emits canonical, description, Open Graph, and site structured data', async ({
    page,
  }) => {
    await page.goto('/');

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/^https?:\/\/[^/]+\/$/);

    expect(
      (await page.locator('meta[name="description"]').getAttribute('content'))?.length,
    ).toBeGreaterThan(0);
    expect(await page.locator('meta[property="og:type"]').getAttribute('content')).toBe('website');
    expect(await page.locator('meta[property="og:title"]').getAttribute('content')).toBeTruthy();
    expect(await page.locator('meta[name="twitter:card"]').getAttribute('content')).toBe(
      'summary_large_image',
    );
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toMatch(/\/og-default\.png$/);

    const ld = await jsonLdByType(page);
    expect(ld.Organization).toBeTruthy();
    expect(ld.WebSite).toBeTruthy();
  });

  test('catalogue detail carries the item title, description, and Article + Breadcrumb JSON-LD', async ({
    page,
  }) => {
    await page.goto('/catalogue/mock-song');

    await expect(page).toHaveTitle(/Mock Song/);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toContain(
      'mock song',
    );
    expect(await page.locator('meta[property="og:type"]').getAttribute('content')).toBe('article');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/catalogue\/mock-song$/);

    const ld = await jsonLdByType(page);
    expect(ld.BreadcrumbList).toBeTruthy();
    expect(ld.Article).toBeTruthy();
    expect(ld.MusicComposition).toBeTruthy();
  });

  test('private pages are marked noindex', async ({ page }) => {
    await page.goto('/signin');
    expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
  });

  test('public pages are not marked noindex', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});
