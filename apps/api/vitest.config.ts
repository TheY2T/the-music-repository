import { nodePreset } from '@TheY2T/tmr-config-vitest';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Unit tier (no Docker): use-cases + domain + the problem+json filter. unplugin-swc compiles
// NestJS decorators + emitDecoratorMetadata (read from tsconfig); tsconfigPaths resolves workspace
// tsconfig path aliases. Integration tests (Testcontainers) run via vitest.integration.config.ts.
// See ADR 0020 · docs/features/testing.md.
export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite()],
  test: nodePreset({
    include: ['src/**/*.test.ts'],
    exclude: ['**/*.integration.test.ts', '**/node_modules/**', '**/dist/**'],
  }).test,
});
