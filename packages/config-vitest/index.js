// Shared Vitest presets — the single source of truth for test config across the monorepo.
// Consumed by each package/app's `vitest.config.ts` via `mergeConfig`. See ADR 0020 +
// docs/features/testing.md. Kept dependency-free (like config-typescript / config-eslint):
// presets are plain objects; consumers own the runner (`vitest`) + coverage provider.

/**
 * Coverage config shared by every project. v8 provider does AST-aware remapping since Vitest 3.2,
 * so reports are Istanbul-accurate without the istanbul provider. Thresholds are set per-package.
 */
export const coverage = {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  exclude: [
    '**/dist/**',
    '**/node_modules/**',
    '**/*.config.*',
    '**/*.d.ts',
    '**/generated/**',
    '**/*.astro',
    '**/e2e/**',
    '**/*.stories.*',
    '**/index.ts',
    '**/main.ts',
    '**/*.module.ts',
  ],
};

/**
 * Node preset — api use-cases/domain + tsc/tsup packages. No DOM.
 * @param {Record<string, unknown>} [overrides] merged into `test`
 */
export function nodePreset(overrides = {}) {
  return {
    test: {
      environment: 'node',
      globals: true,
      coverage,
      ...overrides,
    },
  };
}

/**
 * React/DOM preset — web islands + @TheY2T/tmr-ui. happy-dom by default (faster than jsdom;
 * override per-file with `// @vitest-environment jsdom` when the fuller API is needed).
 * @param {{ setupFiles?: string[] } & Record<string, unknown>} [opts]
 */
export function reactPreset({ setupFiles = [], ...overrides } = {}) {
  return {
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles,
      coverage,
      ...overrides,
    },
  };
}
