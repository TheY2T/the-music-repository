import { expect, test } from './fixtures';
// @ts-expect-error — .mjs sibling without types.
import { authFile } from './mocks/data.mjs';

// The admin localization CMS (ADR 0034): a signed-in admin opens /admin/locale-strings and manages the
// DB-backed UI strings. The messages endpoint is stubbed here (mock mode has no real API); the real
// publish→live cache-bust is exercised against the live stack. Anonymous visitors are bounced to sign-in.
const SEED_ROW = {
  id: 'row-1',
  locale: 'en',
  key: 'nav.catalogue',
  draftValue: 'Catalogue',
  publishedValue: 'Catalogue',
  status: 'published',
  seeded: true,
  deleted: false,
  updatedAt: '2026-07-18T00:00:00.000Z',
};

test.describe('admin locale strings', () => {
  test('redirects an anonymous visitor to sign-in', async ({ page }) => {
    await page.goto('/admin/locale-strings');
    await expect(page).toHaveURL(/\/signin\?redirect=\/admin\/locale-strings/);
  });

  test('an admin sees and can search the string catalogue', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('admin') });
    const page = await context.newPage();
    await context.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        json: { user: { id: 'u-admin', email: 'admin@local.dev', name: 'Admin', role: 'admin' } },
      });
    });
    await context.route('**/admin/i18n/messages*', async (route) => {
      await route.fulfill({ json: { items: [SEED_ROW] } });
    });

    await page.goto('/admin/locale-strings');
    await expect(page).toHaveURL(/\/admin\/locale-strings\/?$/);
    await expect(page.getByText('nav.catalogue')).toBeVisible();

    // Opening the delete confirmation reveals a type-to-confirm gate.
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('button', { name: 'Delete string' })).toBeDisabled();

    await context.close();
  });
});
