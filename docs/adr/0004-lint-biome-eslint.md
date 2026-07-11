# ADR 0004 — Lint/format: Biome primary + thin ESLint

- **Status:** Accepted
- **Context:** Want fast formatting/linting without losing type-aware rules and Astro linting.
- **Decision:** **Biome** owns formatting and most linting. **ESLint** is a thin layer for what Biome
  can't do: type-aware rules and `.astro` files (`eslint-plugin-astro`). One formatter only (Biome).
- **Consequences:** `lint = biome check . && eslint .`. Shared configs in `packages/config-biome`
  and `packages/config-eslint`. The ESLint base is currently non-type-checked for speed/green CI;
  enable `recommendedTypeChecked` per-app as type-aware rules are adopted.
- **Version pins:** ESLint **9.x** and TypeScript **5.x** (newer majors break typescript-eslint 8 /
  NestJS / Astro tooling); `eslint-plugin-astro` **1.x** (2.x needs ESLint 10).
