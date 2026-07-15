import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

// Smoke test for the shared interactive keyboard (ADR 0022 Pixi keybed + ADR 0025 multi-size/audio).
// The visual keybed is a WebGL canvas (role="img"); the real control surface is a parallel set of
// accessible key buttons that stays operable whether or not the canvas renders. Islands that call
// hooks can't be unit-tested under the current getViteConfig env (duplicate-React), so island
// coverage lives here. See docs/features/{pixi-visualization,interactive-tools}.md.
test.describe('interactive keyboard (Pixi)', () => {
  test('mounts the canvas and exposes accessible keys (61-key default)', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });

    // The WebGL canvas region is present and labelled with the current size.
    const canvasRegion = page.getByRole('img', { name: /Piano keyboard — 61 keys/ });
    await expect(canvasRegion).toBeVisible();
    await expect(canvasRegion.locator('canvas')).toBeVisible();

    // 61 accessible key controls (36 white + 25 black), each named by note; C2–C7 default range.
    await expect(page.getByRole('button', { name: 'C2', exact: true })).toBeAttached();
    await expect(page.getByRole('button', { name: 'C7', exact: true })).toBeAttached();
    expect(await page.getByRole('button', { name: /^[A-G]/ }).count()).toBeGreaterThanOrEqual(61);
  });

  test('size selector changes the key range (25 → 88)', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });
    const sizeSelect = page.getByRole('combobox').first();

    await sizeSelect.selectOption('25'); // C3–C5
    await expect(page.getByRole('button', { name: 'C3', exact: true })).toBeAttached();
    await expect(page.getByRole('button', { name: 'C5', exact: true })).toBeAttached();
    await expect(page.getByRole('button', { name: 'A0', exact: true })).toHaveCount(0);

    await sizeSelect.selectOption('88'); // A0–C8
    await expect(page.getByRole('button', { name: 'A0', exact: true })).toBeAttached();
    await expect(page.getByRole('button', { name: 'C8', exact: true })).toBeAttached();
  });

  test('has octave-shift controls and plays via the computer keyboard', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: 'Octave down' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Octave up' })).toBeVisible();

    // QWERTY base defaults to C4 → pressing physical "z" sounds/marks C4. Focus the body first so the
    // window key handler (not a form control) receives the event.
    await page.locator('body').click({ position: { x: 2, y: 2 } });
    await page.keyboard.down('z');
    await expect(page.getByRole('button', { name: 'C4', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.keyboard.up('z');
    await expect(page.getByRole('button', { name: 'C4', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
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
