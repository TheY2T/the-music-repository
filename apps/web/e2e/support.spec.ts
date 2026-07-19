import { expect, test } from './fixtures';

// The `support.kofi` flag defaults on, so the page + links are present in mock mode.
test.describe('Ko-fi support surface', () => {
  test('/support renders its heading', async ({ page }) => {
    const res = await page.goto('/support');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveText('Support The Music Repository');
  });

  test('header and footer expose a Support link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href$="/support"]').first()).toBeVisible();
    await expect(page.locator('footer a[href$="/support"]').first()).toBeVisible();
  });
});
