// SSR mock preload — started via `node --import ./e2e/msw/instrument.mjs ./dist/server/entry.mjs`
// (mirrors the api's OTEL `--require`). Boots an MSW node server so backend fetches made by the
// Astro SSR process are intercepted before the first request. Unmatched requests bypass to the real
// backend (subset mocking). Only loaded in mock mode (see playwright.config.ts). ADR 0020.
import { setupServer } from 'msw/node';
import { selectedHandlers } from './registry.mjs';

const server = setupServer(...selectedHandlers());
server.listen({ onUnhandledRequest: 'bypass' });
process.on('exit', () => server.close());

console.log(`[e2e] MSW SSR mocks active — services: ${process.env.TMR_E2E_MOCK_SERVICES ?? 'all'}`);
