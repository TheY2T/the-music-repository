import { expect, test } from './fixtures';

// Runs against the production server (server.mjs), so these assert the real origin caching headers
// that Cloudflare (and browsers) act on. See docs/features/caching.md + ADR 0051.
test.describe('caching headers', () => {
  test('serves versioned/pinned static assets as immutable', async ({ page }) => {
    const res = await page.request.get('/font/Bravura.woff2');
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  test('an anonymous public page is edge-cacheable and varies on Cookie', async ({ page }) => {
    const res = await page.request.get('/', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()['cache-control']).toBe(
      'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
    );
    // A shared cache must key on the cookie so a signed-in visitor never gets the anonymous variant.
    expect(res.headers().vary).toMatch(/\bCookie\b/);
  });

  test('a private route is never shared', async ({ page }) => {
    // Anonymous → the page gates to /signin; whatever the status, the response must not be cacheable.
    const res = await page.request.get('/admin', { maxRedirects: 0 });
    expect(res.headers()['cache-control']).toBe('private, no-store');
  });
});
