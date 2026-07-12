import { expect, test } from './fixtures';
// @ts-expect-error — .mjs sibling without types.
import { authFile } from './mocks/data.mjs';

// Exercises the SSR admin guard end-to-end: anonymous → redirect to sign-in; a signed-in admin
// (reused storageState + mocked get-session) reaches the console. Demonstrates auth-state reuse.
test.describe('admin access control', () => {
  test('redirects an anonymous visitor to sign-in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/signin\?redirect=\/admin/);
  });

  test('lets a signed-in admin reach the console', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('admin') });
    const page = await context.newPage();
    await context.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        json: { user: { id: 'u-admin', email: 'admin@local.dev', name: 'Admin', role: 'admin' } },
      });
    });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/?$/);
    await context.close();
  });
});
