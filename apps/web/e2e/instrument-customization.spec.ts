import { expect, test } from './fixtures';

// Immersive instrument customization (ADR 0044): native fullscreen, instrument skins, and guitar
// left/right handedness on the piano & guitar tools, gated by `learning.instrument-customization`.
// In the default (mock) harness that flag falls back to its code default (off), so the tools render
// their base view with no customization controls. When the flag is enabled (live mode with it toggled
// on) the same spec exercises the controls. See docs/features/instrument-customization.md.
test.describe('instrument customization', () => {
  test('fretboard tool renders; handedness + fullscreen controls gate on the flag', async ({
    page,
  }) => {
    await page.goto('/tools/fretboard', { waitUntil: 'networkidle' });

    const canvas = page.getByRole('img', { name: /Guitar fretboard/ });
    await expect(canvas).toBeVisible();

    const handedness = page.getByRole('combobox', { name: /Handedness/i });
    if (await handedness.count()) {
      // Flag on: the fretboard mirrors to left-handed and stays operable; fullscreen is offered.
      await handedness.selectOption('left');
      await expect(canvas).toBeVisible();
      await expect(page.getByRole('button', { name: /Fullscreen/i })).toBeVisible();
    } else {
      // Flag off (default): the base view has no skin/handedness/fullscreen controls.
      await expect(page.getByRole('button', { name: /Fullscreen/i })).toHaveCount(0);
      await expect(page.getByRole('combobox', { name: /Skin/i })).toHaveCount(0);
    }
  });

  test('keyboard tool renders; skin + fullscreen controls gate on the flag', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });

    const canvas = page.getByRole('img', { name: /Piano keyboard/ });
    await expect(canvas).toBeVisible();

    const skin = page.getByRole('combobox', { name: /Skin/i });
    if (await skin.count()) {
      // Flag on: switching skin keeps the keybed operable, and fullscreen is offered.
      await skin.selectOption('classic');
      await expect(canvas).toBeVisible();
      await expect(page.getByRole('button', { name: /Fullscreen/i })).toBeVisible();
    } else {
      await expect(page.getByRole('button', { name: /Fullscreen/i })).toHaveCount(0);
    }
  });
});
