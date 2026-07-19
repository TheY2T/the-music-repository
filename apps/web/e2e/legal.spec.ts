import { expect, test } from './fixtures';

const PAGES = [
  { path: '/about', heading: 'About' },
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Service' },
  { path: '/cookies', heading: 'Cookies' },
];

test.describe('legal & company pages', () => {
  for (const { path, heading } of PAGES) {
    test(`${path} renders its heading`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator('h1')).toHaveText(heading);
    });
  }

  test('footer shows the trading name + ABN and links to the legal pages', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toContainText('Michael Hewett');
    await expect(footer).toContainText('ABN 31 769 705 046');
    for (const { path } of PAGES) {
      await expect(footer.locator(`a[href$="${path}"]`)).toBeVisible();
    }
  });

  test('publishes Organization structured data with the ABN', async ({ page }) => {
    await page.goto('/');
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const org = JSON.parse(jsonLd ?? '{}');
    expect(org['@type']).toBe('Organization');
    expect(org.legalName).toBe('Michael Hewett');
    expect(org.identifier).toMatchObject({ propertyID: 'ABN', value: '31769705046' });
  });
});
