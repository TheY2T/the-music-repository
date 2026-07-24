import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from '@playwright/test';
// @ts-expect-error — .mjs sibling without types.
import { authFile, MOCK_USERS, ROLES } from './mocks/data.mjs';

const MODE = process.env.TMR_E2E_MODE ?? 'mock';

// Logs in once per role and saves a reusable storageState (the auth-state-reuse pattern). Mock mode
// injects the recognised session cookie (MSW's get-session maps it to a user) — no network. Live
// mode performs a real sign-in against the running stack. Downstream specs `use({ storageState })`.
setup('authenticate roles', async ({ browser }) => {
  for (const role of ROLES as string[]) {
    const file = authFile(role);
    mkdirSync(dirname(file), { recursive: true });
    const context = await browser.newContext();

    if (MODE === 'live') {
      const page = await context.newPage();
      // Wait for the client:load SignInForm island to hydrate before filling — otherwise the fill can
      // land before React attaches its onChange handlers, the email state stays empty, and the sign-in
      // POST is rejected 400 (empty body).
      await page.goto('/signin', { waitUntil: 'networkidle' });
      await page.getByLabel(/email/i).fill(MOCK_USERS[role].email);
      // Exact label so the "Show password" toggle (aria-label "Show password") isn't also matched.
      await page.getByLabel('Password', { exact: true }).fill('password123');
      // Guard against the controlled-input commit race: confirm React holds the values before submit.
      await expect(page.getByLabel(/email/i)).toHaveValue(MOCK_USERS[role].email);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');
    } else {
      // Mock mode: the cookie name contains "better-auth" so the SSR middleware forwards it, and
      // MSW's get-session handler resolves `mock-<role>` → the matching user.
      await context.addCookies([
        {
          name: 'better-auth.session_token',
          value: `mock-${role}`,
          domain: 'localhost',
          path: '/',
        },
      ]);
    }

    await context.storageState({ path: file });
    await context.close();
  }
});
