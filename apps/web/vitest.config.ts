/// <reference types="vitest/config" />
import { reactPreset } from '@TheY2T/tmr-config-vitest';
import { getViteConfig } from 'astro/config';

// Astro's helper loads astro.config (React integration + the `.astro` compiler + `@/*` tsconfig
// paths) into the test environment, so React islands, `@/*` imports, and `.astro` components (via
// the Container API) all resolve. happy-dom + Testing Library come from the shared reactPreset.
// See ADR 0020 · docs/features/testing.md.
export default getViteConfig({
  test: reactPreset({
    setupFiles: ['./src/test/setup.ts'],
    // Unit/component tests only — Playwright e2e specs (e2e/*.spec.ts) run via playwright.config.ts.
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  }).test,
});
