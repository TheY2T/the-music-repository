import { expect, test } from './fixtures';

// Immersive instrument customization (ADR 0044): native fullscreen, instrument skins, and guitar
// left/right handedness on the piano & guitar tools. Always available (not behind a flag).
// See docs/features/instrument-customization.md.
test.describe('instrument customization', () => {
  test('fretboard tool renders with handedness + fullscreen controls', async ({ page }) => {
    await page.goto('/tools/fretboard', { waitUntil: 'networkidle' });

    const canvas = page.getByRole('img', { name: /Guitar fretboard/ });
    await expect(canvas).toBeVisible();

    // The fretboard mirrors to left-handed and stays operable; fullscreen is offered.
    await page.getByRole('combobox', { name: /Handedness/i }).selectOption('left');
    await expect(canvas).toBeVisible();
    await expect(page.getByRole('button', { name: /Fullscreen/i })).toBeVisible();
  });

  test('keyboard tool renders with skin + fullscreen controls', async ({ page }) => {
    await page.goto('/tools/keyboard', { waitUntil: 'networkidle' });

    const canvas = page.getByRole('img', { name: /Piano keyboard/ });
    await expect(canvas).toBeVisible();

    // Switching skin keeps the keybed operable, and fullscreen is offered.
    await page.getByRole('combobox', { name: /Skin/i }).selectOption('classic');
    await expect(canvas).toBeVisible();
    await expect(page.getByRole('button', { name: /Fullscreen/i })).toBeVisible();
  });
});
