import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

// Smoke test for the PixiJS-rendered piano tool (ADR 0022). The visual keybed is a WebGL canvas
// (role="img"); the real control surface is a parallel set of accessible key buttons that stays
// operable whether or not the canvas renders. Islands that call hooks can't be unit-tested under
// the current getViteConfig env (duplicate-React), so island coverage lives here. See
// docs/features/pixi-visualization.md.
test.describe('interactive keyboard (Pixi)', () => {
  test('mounts the canvas and exposes accessible keys', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });

    // The WebGL canvas region is present and labelled.
    const canvasRegion = page.getByRole('img', { name: /Piano keyboard/ });
    await expect(canvasRegion).toBeVisible();
    await expect(canvasRegion.locator('canvas')).toBeVisible();

    // Two octaves of accessible key controls (14 white + 10 black), each named by note.
    await expect(page.getByRole('button', { name: 'C4', exact: true })).toBeAttached();
    await expect(page.getByRole('button', { name: 'B5', exact: true })).toBeAttached();
    expect(await page.getByRole('button', { name: /^[A-G]/ }).count()).toBeGreaterThanOrEqual(24);
  });

  test('has no serious or critical accessibility violations', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
