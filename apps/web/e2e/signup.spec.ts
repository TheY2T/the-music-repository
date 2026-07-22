import { expect, test } from './fixtures';

// Self-service sign-up. The Better Auth sign-up endpoint is stubbed per-test so the flow runs without a
// live API (mock mode). An anonymous visitor reaches the page (the `auth.signup` flag is on by default).
test.describe('Sign up', () => {
  test('creates an account and shows a verify-your-email confirmation', async ({ page }) => {
    await page.route('**/api/auth/sign-up/email', (route) =>
      route.fulfill({ json: { token: null, user: { id: 'u1', email: 'ada@example.com' } } }),
    );

    await page.goto('/signup');
    await expect(page.locator('h1')).toHaveText('Create your account');

    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('signin page links to sign up', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
  });
});
