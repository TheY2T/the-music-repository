import { expect, test } from './fixtures';

// The `content.faq` flag defaults on, so the page + footer link are present in mock mode. Entries are
// SSR-fetched from the API; in mock mode (no FAQ handler) the list is empty and the page shows its
// empty state — so these checks stay data-independent.
test.describe('FAQ', () => {
  test('/faq renders its heading', async ({ page }) => {
    const res = await page.goto('/faq');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveText('Frequently asked questions');
  });

  test('footer exposes an FAQ link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a[href$="/faq"]').first()).toBeVisible();
  });
});
