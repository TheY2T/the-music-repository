import { expect, test } from './fixtures';

// Exercises the SSR middleware's locale resolution + URL-prefix rewrite (platform.i18n flag on by
// default in mock mode). The browser URL keeps the /zh prefix while a single page-file set renders.
test.describe('localized routing', () => {
  test('serves English at the un-prefixed root', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle(/The Music Repository/);
  });

  test('serves Simplified Chinese under /zh', async ({ page }) => {
    await page.goto('/zh');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
    await expect(page).toHaveTitle(/音乐资料库/);
  });

  // A nested locale path exercises the injected catch-all route (`/zh/[...path]`) — the node adapter's
  // `middleware` mode runs the SSR rewrite only for URLs that match a route, so without the catch-all a
  // deep `/zh/…` path 404s before the middleware can strip the prefix. Guards that regression.
  test('serves Simplified Chinese under a nested /zh path', async ({ page }) => {
    await page.goto('/zh/about');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hans');
  });
});
