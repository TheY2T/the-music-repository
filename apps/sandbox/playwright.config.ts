import { defineConfig, devices } from '@playwright/test';

// The sandbox is fully standalone (no API, no MSW): build the node output and serve it. Components
// render from the mock data-port + the i18n bundled fallback, so the E2E stack needs nothing else.
const PORT = 4322;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: { baseURL: BASE_URL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm build && node ./dist/server/entry.mjs',
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: { HOST: '127.0.0.1', PORT: String(PORT) },
  },
});
