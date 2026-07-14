# ADR 0022 — PixiJS client-only rendering layer for interactive tools

- **Status:** accepted
- **Date:** 2026-07
- **Context:** The interactive tools (`apps/web/src/pages/tools/*`) render either inline SVG or plain
  DOM/Tailwind. Several want continuous 60fps motion (note-fall, glows, audio-reactive waveforms,
  particles) that DOM/SVG can't deliver smoothly, and two of them (`PianoKeyboard`,
  `GuitarFretboard`) used hardcoded palette colours (`bg-blue-*`, `bg-neutral-800`) that violate the
  "theme with tokens" rule (ADR 0021) and don't re-tint across the six palettes. We want a GPU
  rendering layer for the visual/animated parts of these tools without regressing accessibility,
  theming, or SSR.

## Decision

1. **PixiJS v8 + `@pixi/react` v8** as a **client-only** rendering layer, added to the pnpm catalog
   (one shared copy — mismatched `pixi.js` copies break `extend()`/`instanceof`). Peer-compatible
   with our React 19.

2. **One boundary: `apps/web/src/components/PixiCanvas.tsx`.** Every Pixi surface goes through it. It
   `React.lazy`-imports the scene module (so Pixi's large bundle + `extend()` calls stay out of the
   initial payload and the SSR path) and renders an **accessible DOM fallback during SSR and the
   first client render**, then upgrades to the WebGL canvas after mount. This makes the tool pages
   keep `client:load` (instant SSR paint of the real accessible control) with no hydration mismatch.

3. **Progressive enhancement, no feature flag.** If WebGL is unavailable the fallback stays. The tool
   *pages* keep their existing page-level `tools.*` flags (the kill-switch); we do **not** add a
   `platform.pixi` flag.

4. **Full rewrite + parallel accessible controls.** Each interactive tool becomes a Pixi canvas
   (`role="img"` + `aria-label`) **plus** a real, operable DOM control set (buttons/SVG with
   keyboard nav + `aria-label`s) that is the fallback when WebGL is off and is kept in the DOM
   (visually hidden) when the canvas is up. The canvas is never the sole interaction surface.

5. **Theme via tokens, not colours.** Pixi can't read `var(--token)`, so
   `apps/web/src/lib/pixi/use-theme-colors.ts` resolves the semantic design tokens to `0xRRGGBB`
   ints (through a hidden probe + `getComputedStyle`, robust to hex/`oklch`) and a `MutationObserver`
   on `<html>` re-reads them when `ThemeSwitcher` flips `data-theme`/`.dark`. Canvases are
   **transparent** (`backgroundAlpha={0}`) — Pixi's `background` only applies at init and won't
   re-tint — so the themed page background shows through and scenes draw their own surfaces (which
   do re-tint).

6. **Audio-reactive tap.** `apps/web/src/lib/audio.ts` gained a master bus
   (`masterGain → analyser → destination`, unity gain, behaviour-preserving) exposed via
   `getAnalyser()`, so visualizers can read the live waveform/spectrum of everything the app plays.

7. **Conventions:** gate scene rendering on `useApplication().isInitialised` (`app.screen` throws
   before the async renderer init); `autoDensity` + capped `resolution`; `extend()` only the classes
   a scene uses (tree-shaking); respect `prefers-reduced-motion`; one `<Application>` per island
   (auto-destroyed on unmount).

## Consequences

- **Delivered:** Phase 1 — `PianoKeyboard`/`GuitarFretboard`/`CircleOfFifths` token-themed GPU
  scenes (fixing the hardcoded-colour violations), each with an accessible fallback. Phase 2 — an
  audio-reactive spectrum/waveform (`AudioVisualizer`, embedded on the backing track) + a real mic
  tuner (`getUserMedia` → autocorrelation pitch detection → a Pixi needle gauge). Phase 3 — a
  notation play-head glow overlay on the Verovio SVG (`useNotationPlayhead`, additive). Phase 4 — an
  ambient dust-mote background behind the home hero (`AmbientBackground`), a drop-in gamified
  drill-feedback burst (`DrillFeedback`, wired into three ear-training tools + one-liner for the
  rest), and an animated sparkle over the catalogue detail cover (`AnimatedCoverArt`, single-instance
  only — the grid keeps the plain SVG `CoverArt` to stay under the WebGL context cap).
- **Decorative option:** `PixiCanvas` gained a `decorative` prop (`aria-hidden` region, no sr-only
  fallback) for the purely-visual canvases (ambient / feedback / visualizer / sparkle).
- **Bundle:** Pixi is large, so it is strictly lazy-loaded per island (never global). `pixi.js`/
  `@pixi/react` are intentionally **not** in `optimizeDeps.include` — including them made Astro's
  `getViteConfig` pull a duplicate React into the Vitest optimizer. Vite discovers + optimizes them
  on first runtime use (a one-time dev `504 Outdated Optimize Dep` that self-heals on reload).
- **Testing:** foundation logic is unit-tested (theme-token parsing, audio master-bus routing).
  Island hook-components can't be unit-tested under the current `getViteConfig` env (a pre-existing
  duplicate-React limitation — the only prior island test calls no hooks), so island coverage
  (canvas mount + accessible keys + a11y scan) lives in a Playwright E2E smoke instead.
- **a11y:** the canvas is decorative; the accessible control set + WebGL fallback + reduced-motion
  handling mean AT/keyboard users are never locked out (verified: zero serious/critical axe
  violations on the keyboard tool).
