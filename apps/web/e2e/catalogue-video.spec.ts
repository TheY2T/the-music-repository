import { expect, test } from './fixtures';

test.describe('Catalogue — YouTube video embed', () => {
  test('emits crawler-visible VideoObject structured data in the SSR head', async ({ page }) => {
    await page.goto('/catalogue/mock-song');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const video = blocks
      .map((raw) => JSON.parse(raw) as { '@type'?: string; embedUrl?: string })
      .find((ld) => ld['@type'] === 'VideoObject');
    expect(video).toBeTruthy();
    expect(video?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  test('renders a facade and loads the privacy-friendly iframe only on click', async ({ page }) => {
    await page.goto('/catalogue/mock-song');

    // Facade only — a poster thumbnail, no YouTube iframe yet.
    const poster = page.locator('img[src*="ytimg.com"]');
    await expect(poster).toBeVisible();
    await expect(page.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(0);

    // Pressing play swaps in the youtube-nocookie player.
    await page.locator('button:has(img[src*="ytimg.com"])').click();
    await expect(
      page.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]'),
    ).toBeVisible();
  });
});
