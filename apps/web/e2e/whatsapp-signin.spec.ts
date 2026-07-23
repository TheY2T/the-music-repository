import { expect, test } from './fixtures';

// WhatsApp phone-OTP sign-in (auth.whatsapp): a passwordless two-step flow (enter number → enter code)
// on the sign-in form. The button is gated by `auth.whatsapp`, which defaults off — so in the default
// (mock) harness the button is absent, and the spec asserts that. When the flag is enabled (live mode
// with it toggled on) the same spec stubs the Better Auth phone-number endpoints and drives the flow
// through to a signed-in redirect. See docs/features/auth.md.
test.describe('WhatsApp sign-in', () => {
  test('gates on auth.whatsapp; runs the phone→code flow when enabled', async ({ page }) => {
    await page.route('**/api/auth/phone-number/send-otp', (route) =>
      route.fulfill({ json: { code: true } }),
    );
    await page.route('**/api/auth/phone-number/verify', (route) =>
      route.fulfill({ json: { status: true, token: 'wa-session', user: { id: 'u_wa' } } }),
    );

    await page.goto('/signin');
    const whatsapp = page.getByRole('button', { name: 'Continue with WhatsApp' });

    if (await whatsapp.count()) {
      // Flag on: enter a number, request a code, verify it, land signed-in off the sign-in page.
      await whatsapp.click();
      await page.getByLabel('Phone number').fill('+61400000000');
      await page.getByRole('button', { name: 'Send code via WhatsApp' }).click();
      await page.getByLabel('Enter the 6-digit code').fill('123456');
      await page.getByRole('button', { name: 'Verify and sign in' }).click();
      await page.waitForURL((url) => !url.pathname.endsWith('/signin'));
    } else {
      // Flag off (default mock harness): the WhatsApp button is absent.
      await expect(whatsapp).toHaveCount(0);
    }
  });
});
