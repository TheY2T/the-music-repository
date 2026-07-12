import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test.describe('home page', () => {
  test('loads with the site title in English', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/The Music Repository/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('has no serious or critical accessibility violations', async ({ page }) => {
    // Wait for islands to finish hydrating/redirecting so axe scans a settled DOM.
    await page.goto('/', { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
