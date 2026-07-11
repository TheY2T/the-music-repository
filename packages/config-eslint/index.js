import tseslint from 'typescript-eslint';

/**
 * Shared, intentionally *thin* ESLint flat config.
 *
 * Biome owns formatting and the bulk of linting. ESLint is kept only for rules Biome
 * doesn't cover (type-aware rules and framework plugins). The base here is non-type-checked
 * to stay fast and green; enable `tseslint.configs.recommendedTypeChecked` per-app (with a
 * `projectService`) as type-aware rules are adopted — see docs/adr/0004-lint-biome-eslint.md.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.astro/**',
      '**/node_modules/**',
      '**/drizzle/**',
      '**/*.config.*',
      '**/coverage/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Biome owns `noExplicitAny` (with `biome-ignore` for intentional cases). Don't double-enforce.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
