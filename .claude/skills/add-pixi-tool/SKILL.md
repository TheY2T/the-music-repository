---
name: add-pixi-tool
description: Author a client-only PixiJS visual/scene for The Music Repository through the PixiCanvas boundary — lazy scene module, useThemeColors token bridge, mandatory accessible DOM fallback, and E2E coverage. Use when adding an audio-reactive, particle, or 60fps-cursor visual to an interactive tool or a decorative background. See ADR 0022/0029 + docs/features/pixi-visualization.md.
---

# add-pixi-tool

PixiJS v8 + `@pixi/react` v8, client-only WebGL, living in `@TheY2T/tmr-music-core`. **Reach for Pixi only
when SVG/Canvas2D/CSS would drop frames** (audio-reactive meters, particles, 60fps play-head). Static or
few-shape visuals stay SVG/DOM.

## 1. Write the scene module

`packages/music-core/src/pixi/<name>-scene.tsx`. Inside the lazy module:
- `extend()` **only** the Pixi classes you use (keeps the bundle lean).
- Gate rendering on `useApplication().isInitialised` — `app.screen` throws before init.
- Read colours via `useThemeColors()` → `0xRRGGBB` ints; re-read on theme change. **Never** `var(--token)`
  inside a canvas — draw surfaces with `Graphics` (Pixi's `background` doesn't re-tint).
- `autoDensity` + a capped `resolution`; respect `prefers-reduced-motion`.
- Audio-reactive? read `getAnalyser()` from `music-core`'s `audio.ts` (master-bus FFT).

## 2. Mount through PixiCanvas (the only boundary)

Render `<PixiCanvas>` with a lazy scene import and a **mandatory accessible fallback**:

```tsx
<PixiCanvas
  scene={() => import('../pixi/<name>-scene')}
  backgroundAlpha={0}                 // transparent — draw your own surfaces
  fallback={<AccessibleControls … />} // parallel, operable DOM (buttons/SVG, keyboard nav, aria-labels)
/>
```

`PixiCanvas` renders the `fallback` during SSR + first client render, then upgrades to a transparent
`role="img"` canvas after mount; the fallback stays in the DOM (visually hidden) as the real control
surface. **The canvas is never the sole interaction surface** — WebGL-absent users get the fallback.

## 3. Wiring gotcha

`pixi.js`/`@pixi/react` are **NOT** in `optimizeDeps.include` (including them pulls a duplicate React into
the Vitest optimizer → "invalid hook call"). They're lazy-imported → Vite optimizes on first dev use (a
one-time `504` that self-heals on reload; `rm -rf apps/web/node_modules/.vite` if it sticks).

## 4. Tests (Definition of Done — `add-tests`)

Pixi island/hook components **can't** be unit-tested under `getViteConfig` (duplicate-React). Cover the
tool with a **Playwright E2E smoke** (it renders, the fallback is operable, no console errors). Unit-test
any pure scene math separately.

## 5. Verify

Run the tool locally (**`run-local`**), confirm the canvas paints, toggle the theme and confirm colours
re-tint, and tab through the fallback controls with WebGL disabled.
