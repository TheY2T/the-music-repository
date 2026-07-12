import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
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
      await page.goto('/signin');
      await page.getByLabel(/email/i).fill(MOCK_USERS[role].email);
      await page.getByLabel(/password/i).fill('password123');
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
