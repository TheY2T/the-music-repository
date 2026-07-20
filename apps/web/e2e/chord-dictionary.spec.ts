import { expect, test } from './fixtures';

// Smoke test for the chord dictionary tool. The island calls the soundfont/instrument hooks (duplicate-
// React optimizer), so island coverage lives here rather than in a Vitest component test. Flags fall back
// to code defaults in mock mode, where tools.chord-dictionary defaults on.
test.describe('chord dictionary', () => {
  test('browses guitar chords with finger/barre diagrams and paginates', async ({ page }) => {
    await page.goto('/tools/chord-dictionary', { waitUntil: 'networkidle' });

    // Browse grid renders fretboard chord diagrams (each an SVG labelled "<name> chord diagram").
    const diagrams = page.getByRole('img', { name: /chord diagram$/ });
    await expect(diagrams.first()).toBeVisible();
    expect(await diagrams.count()).toBeGreaterThan(1);

    // The standard paginated list footer is present.
    await expect(page.getByText('Per page')).toBeVisible();
  });

  test('switches to piano and renders keyboard chord diagrams', async ({ page }) => {
    await page.goto('/tools/chord-dictionary', { waitUntil: 'networkidle' });
    // First combobox is the instrument picker.
    await page.getByRole('combobox').first().selectOption('piano');
    const keyboards = page.getByRole('img', { name: /^Keyboard chord diagram/ });
    await expect(keyboards.first()).toBeVisible();
  });

  test('shows every voicing when a specific root + type are selected', async ({ page }) => {
    await page.goto('/tools/chord-dictionary', { waitUntil: 'networkidle' });
    const combos = page.getByRole('combobox');
    await combos.nth(1).selectOption('0'); // root C
    await combos.nth(2).selectOption('major'); // major
    // Detail view: a heading naming the chord, and multiple voicing diagrams (C has several positions).
    await expect(page.getByRole('heading', { name: /C\s+Major/ })).toBeVisible();
    expect(await page.getByRole('img', { name: /chord diagram$/ }).count()).toBeGreaterThan(1);
  });
});
