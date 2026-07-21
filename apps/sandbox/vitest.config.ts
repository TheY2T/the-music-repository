/// <reference types="vitest/config" />
import { reactPreset } from '@TheY2T/tmr-config-vitest';
import { getViteConfig } from 'astro/config';

// Astro's helper loads astro.config (React integration + the `.astro` compiler + `@/*` tsconfig paths)
// into the test environment, so React islands and `@/*` imports resolve. happy-dom + Testing Library
// come from the shared reactPreset. Pixi/smplr/alphaTab specimens are covered by E2E, not here.
export default getViteConfig({
  test: reactPreset({
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  }).test,
});
