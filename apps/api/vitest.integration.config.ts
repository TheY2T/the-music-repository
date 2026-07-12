import { nodePreset } from '@TheY2T/tmr-config-vitest';
import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Integration tier: `*.integration.test.ts` against a real Postgres via Testcontainers (needs a
// Docker/podman socket). Serialized with generous timeouts because container pull + boot + Drizzle
// migrations are slow. Run with `pnpm --filter @TheY2T/tmr-api test:integration`.
export default defineConfig({
  plugins: [tsconfigPaths(), swc.vite()],
  test: nodePreset({
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    pool: 'forks',
    fileParallelism: false,
  }).test,
});
