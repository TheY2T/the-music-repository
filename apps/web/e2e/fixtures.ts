import { test as base, expect } from '@playwright/test';
import { installBrowserMocks } from './mocks/browser-routes';

const MODE = process.env.TMR_E2E_MODE ?? 'mock';

// In mock mode, every test's page gets the browser-side backend mocks auto-installed (the SSR layer
// is handled by the MSW preload). In live mode this is a no-op — tests hit the real stack.
export const test = base.extend({
  page: async ({ page }, use) => {
    if (MODE === 'mock') {
      await installBrowserMocks(page);
    }
    await use(page);
  },
});

export { expect };
