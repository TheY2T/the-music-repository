import { defineConfig, devices } from '@playwright/test';

// Dual-mode E2E (ADR 0020 · docs/features/testing.md):
//  • mock (default): build + serve the node output with the MSW SSR preload; backend mocked per
//    TMR_E2E_MOCK_SERVICES ("all" or a comma list — unlisted services hit the real backend). flagd
//    is pointed at a dead port so flags instantly fall back to their defaults (deterministic).
//  • live: serve against the real stack (`pnpm infra:up` + api running, or the podman-compose
//    stack). Run with `TMR_E2E_MODE=live`.
const MODE = process.env.TMR_E2E_MODE ?? 'mock';
const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

const serveCommand =
  MODE === 'live'
    ? 'pnpm build && node ./dist/server/entry.mjs'
    : 'pnpm build && node --import ./e2e/msw/instrument.mjs ./dist/server/entry.mjs';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: { baseURL: BASE_URL, trace: 'on-first-retry' },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, dependencies: ['setup'] },
  ],
  webServer: {
    command: serveCommand,
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      HOST: '127.0.0.1',
      PORT: String(PORT),
      TMR_E2E_MODE: MODE,
      TMR_E2E_MOCK_SERVICES: process.env.TMR_E2E_MOCK_SERVICES ?? 'all',
      // Mock mode: unreachable flagd port → instant connection-refused → flags use defaults.
      FLAGD_PORT: MODE === 'live' ? (process.env.FLAGD_PORT ?? '8013') : '1',
      PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
    },
  },
});
