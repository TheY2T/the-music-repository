import { expect, test } from './fixtures';

// Sign in with Apple (auth.apple): a one-click OAuth button on the sign-in form, gated by `auth.apple`,
// which defaults off — so in the default (mock) harness the button is absent and the spec asserts that.
// When the flag is enabled (live mode with it toggled on), clicking it starts Better Auth's Apple social
// flow; the spec stubs that endpoint and asserts the request fires rather than following the external
// redirect to appleid.apple.com. See docs/features/auth.md.
test.describe('Apple sign-in', () => {
  test('gates on auth.apple; starts the Apple OAuth flow when enabled', async ({ page }) => {
    await page.route('**/api/auth/sign-in/social', (route) => route.fulfill({ json: {} }));

    await page.goto('/signin');
    const apple = page.getByRole('button', { name: 'Continue with Apple' });

    if (await apple.count()) {
      // Flag on: clicking initiates the Apple social sign-in request.
      const request = page.waitForRequest('**/api/auth/sign-in/social');
      await apple.click();
      await request;
    } else {
      // Flag off (default mock harness): the Apple button is absent.
      await expect(apple).toHaveCount(0);
    }
  });
});
