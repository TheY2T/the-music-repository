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
});
