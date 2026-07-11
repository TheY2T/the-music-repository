# ADR 0005 — Internal package format (dual ESM+CJS) & tsconfig extends

- **Status:** Accepted
- **Context:** Internal packages (`@TheY2T/tmr-contracts`, `@TheY2T/tmr-flags`) are consumed by both
  NestJS (CommonJS) and Astro (ESM, bundled by Vite 8 / oxc). A CommonJS-only build threw
  `exports is not defined` when Astro dev loaded it as ESM. Separately, `astro dev` threw
  `[TSCONFIG_ERROR] ... Tsconfig not found` because oxc reads a built package's nearest
  `tsconfig.json` and its `extends` resolver does not perform node package resolution.

- **Decision:**
  1. Build internal packages with **tsup** as **dual ESM + CJS** (`--format esm,cjs --dts`), with an
     `exports` map (`import` → `dist/index.js`, `require` → `dist/index.cjs`) plus top-level
     `main` (cjs) + `types` so NestJS's classic (`node`) resolver — which ignores `exports` — still
     resolves.
  2. Use **relative paths** for `tsconfig` `extends` (`../config-typescript/base.json`), not the
     scoped package name.

- **Consequences:** Both runtimes load the correct format; dev and build are green. Application code
  still imports internal packages by **scoped name** (`@TheY2T/tmr-*`) — only the build-tooling
  concern of `tsconfig extends` uses relative paths. Config packages still expose an `exports` map
  (harmless, helps tsc/editors) even though oxc doesn't honor it for `extends`.
