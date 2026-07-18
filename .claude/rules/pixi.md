---
paths:
  - "**/pixi/**"
  - "**/*PixiCanvas*"
  - "**/*-scene.ts"
  - "**/*-scene.tsx"
---

# PixiJS visualization layer (ADR 0022, `docs/features/pixi-visualization.md`)

Client-only WebGL (PixiJS v8 + `@pixi/react` v8, cataloged so one copy resolves) for the *visual/animated*
parts of tools. Reach for it **only** when SVG/Canvas2D/CSS would drop frames (audio-reactive, particles,
60fps cursor); **static/few-shape stays SVG/DOM**. Author via the **`add-pixi-tool`** skill.

## The boundary — everything goes through `PixiCanvas`

`PixiCanvas` (`packages/music-core`) lazy-imports the scene (`() => import('…/<name>-scene')`), renders the
accessible DOM `fallback` during SSR + first client render, then upgrades to a transparent `role="img"`
canvas after mount. The `fallback` stays in the DOM (visually hidden) as the real control surface; WebGL
absent → fallback stays.

## Rules

- **Accessible fallback is mandatory** — a parallel, operable DOM control set (buttons/SVG, keyboard nav,
  `aria-label`s). The canvas is never the sole interaction surface.
- **Theme with tokens, not colours** — read colours via `useThemeColors()` → `0xRRGGBB` ints, re-read on
  `ThemeSwitcher` change. Keep canvases transparent (`backgroundAlpha={0}`) and draw with `Graphics`
  (Pixi's `background` doesn't re-tint).
- **Scene rules:** `extend()` only the classes used (inside the lazy module); gate render on
  `useApplication().isInitialised` (`app.screen` throws before init); `autoDensity` + capped `resolution`;
  respect `prefers-reduced-motion`. Audio-reactive scenes read `getAnalyser()` from `audio.ts` (master bus).
- **Gotcha:** `pixi.js`/`@pixi/react` are **NOT** in `optimizeDeps.include` (including them pulls a
  duplicate React into the Vitest optimizer → "invalid hook call"). They're lazy-imported → Vite optimizes
  on first dev use (a one-time `504` that self-heals; restart dev / `rm -rf node_modules/.vite` if it
  sticks). Cover Pixi islands with a **Playwright E2E smoke**, not unit tests (duplicate-React).
