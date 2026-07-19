import { expect, test } from './fixtures';

// Forgot-password → reset flow. The Better Auth reset endpoints are stubbed per-test so the flow can be
// exercised without a live API (mock mode). An anonymous visitor reaches both pages.
test.describe('Password reset', () => {
  test('requests a reset link and reports a neutral confirmation', async ({ page }) => {
    await page.route('**/api/auth/request-password-reset', (route) =>
      route.fulfill({ json: { status: true } }),
    );

    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toHaveText('Forgot your password?');

    await page.getByLabel('Email').fill('learner@local.dev');
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(
      page.getByText('If an account exists for that email, a reset link is on its way.'),
    ).toBeVisible();
  });

  test('sets a new password from a reset link and returns to sign in', async ({ page }) => {
    await page.route('**/api/auth/reset-password', (route) =>
      route.fulfill({ json: { status: true } }),
    );

    await page.goto('/reset-password?token=tok-e2e');
    await expect(page.locator('h1')).toHaveText('Choose a new password');

    await page.getByLabel('New password', { exact: true }).fill('new-password-123');
    await page.getByLabel('Confirm new password').fill('new-password-123');
    await page.getByRole('button', { name: 'Reset password' }).click();

    await page.waitForURL('**/signin');
  });

  test('shows an invalid-link message when the token is missing', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(
      page.getByText('This reset link is invalid or has expired. Request a new one.'),
    ).toBeVisible();
  });

  test('signin page links to forgot-password', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });
});
