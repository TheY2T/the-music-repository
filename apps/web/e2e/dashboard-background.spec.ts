import { expect, test } from './fixtures';
// @ts-expect-error — .mjs sibling without types.
import { authFile } from './mocks/data.mjs';

// Settings surface + animated dashboard background (PixiJS decorative canvas). Anonymous visitors are
// bounced to sign-in; a signed-in learner can pick a style + intensity, preview it live, apply it, and
// see the saved scene render behind the dashboard. Pixi islands can't be unit-tested (duplicate-React
// under getViteConfig), so island coverage lives here. See docs/features/dashboard-background.md.
test.describe('dashboard background settings', () => {
  test('redirects an anonymous visitor to sign-in', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/signin\?redirect=\/settings/);
  });

  test('signed-in learner picks a style + intensity, applies, and sees it on the dashboard', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile('learner') });
    const page = await context.newPage();
    await context.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        json: {
          user: { id: 'u-learner', email: 'learner@local.dev', name: 'Learner', role: 'learner' },
        },
      });
    });

    await page.goto('/settings', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Dashboard background' })).toBeVisible();

    // The live preview mounts a WebGL canvas for the default (non-"none") style.
    const preview = page.locator('canvas').first();
    await expect(preview).toBeVisible();

    // Apply is disabled until the draft differs from the saved preference.
    const apply = page.getByRole('button', { name: 'Apply' });
    await expect(apply).toBeDisabled();

    // Choose "Piano roll" → Apply enables → persist.
    await page.getByRole('button', { name: /Piano roll/ }).click();
    await expect(apply).toBeEnabled();
    await apply.click();

    // Persisted to localStorage.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('tmr.dashboardBg.style')))
      .toBe('roll');

    // The dashboard reads the saved preference and renders a canvas behind its content.
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('canvas').first()).toBeVisible();

    // "None" removes the canvas entirely.
    await page.goto('/settings', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /None No animated background/ }).click();
    await page.getByRole('button', { name: 'Apply' }).click();
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page.locator('canvas')).toHaveCount(0);

    await context.close();
  });
});
