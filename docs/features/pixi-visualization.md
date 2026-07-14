# PixiJS visualization layer

A client-only WebGL rendering layer (PixiJS v8 + `@pixi/react` v8) for the visual/animated parts of
the interactive tools. See ADR 0022 for the decision record.

## When to use Pixi (and when not to)

Reach for Pixi only when SVG/Canvas2D/CSS would drop frames or can't express the effect:
audio-reactive visuals, particle-heavy scenes, 100s of animated nodes, shader/ambient backgrounds,
or a 60fps playback cursor. **Everything static or few-shape stays SVG/DOM** — better for theming,
a11y, SSR, and bundle size. A static chord diagram does not need WebGL.

## Architecture

```
tool.astro (client:load)
  └─ <SomeTool> island (DOM controls + state + audio/MIDI)
       ├─ <PixiCanvas fallback={<AccessibleControls/>} loader={() => import('…/scene')} …/>
       │     ├─ SSR + first client render → renders `fallback` (accessible DOM)
       │     └─ after mount + WebGL check → lazy scene on a transparent <canvas> (role="img")
       │                                     + `fallback` kept in the DOM, visually hidden
       └─ help text, etc.
```

- **`apps/web/src/components/PixiCanvas.tsx`** — the single boundary. Lazy-imports the scene (Pixi's
  bundle + `extend()` stay out of the initial payload and the SSR path), renders the accessible
  `fallback` during SSR + the first client render (so hydration matches), then upgrades to the WebGL
  canvas. If WebGL is unavailable, the fallback stays. Passes `resizeTo` (container ref),
  `reducedMotion`, and `resolution` (capped `devicePixelRatio`) to the scene.
- **Scenes** — `apps/web/src/lib/pixi/<name>-scene.tsx`, each a default-exported component taking
  `PixiSceneBaseProps` + its own props. Render `<Application backgroundAlpha={0} resizeTo resolution
  autoDensity antialias>` wrapping a scene-graph component.
- **`apps/web/src/lib/pixi/use-theme-colors.ts`** — resolves semantic design tokens to `0xRRGGBB`
  ints and re-reads them (via a `MutationObserver` on `<html>`) when the aesthetic/dark mode changes.
- **`apps/web/src/lib/pixi/use-webgl.ts`** — `supportsWebGL()` + `usePrefersReducedMotion()`.
- **`apps/web/src/lib/audio.ts`** — `getAnalyser()` taps the master bus for audio-reactive scenes.

## Authoring a scene (checklist)

1. `extend({ Container, Graphics, Text, … })` at module top — **only** the classes the scene uses
   (this is the tree-shaking gate), inside the lazily-loaded module (never on the SSR path).
2. Gate rendering on `useApplication().isInitialised` — `app.screen` throws before the async
   renderer init resolves. Return `null` until ready.
3. Keep the canvas **transparent** and draw surfaces with `Graphics` so they re-tint. Pixi's
   `<Application background>` only applies at init and will **not** update on theme change.
4. Colours come from `useThemeColors()` (never `var(--token)`); Graphics v8 API is
   `shape().fill({color})/.stroke({color,width})` (`rect`/`roundRect`/`circle`/`arc`/`moveTo`/`lineTo`).
5. Memoize `useTick`/`draw` callbacks. Drive per-frame motion imperatively via a ref-held Graphics
   (`<pixiGraphics ref={…} draw={noDraw}/>`) to avoid per-frame React renders.
6. Skip animation work when `reducedMotion` is true.
7. Prefer scheduler event times for playback-synced visuals; use `getAnalyser()` only for true
   waveform/spectrum/tuner cases.

## Accessibility contract

The canvas is decorative (`role="img"` + `aria-label`). The tool **must** provide a parallel,
operable DOM control set as the `PixiCanvas` `fallback` — real buttons/SVG with keyboard nav and
`aria-label`s. It is shown when WebGL is off and kept in the DOM (visually hidden) when the canvas is
up, so AT/keyboard users are never locked out.

## Surfaces

**Phase 1 — interactive instruments.** `PianoKeyboard` (`piano-scene`), `GuitarFretboard`
(`fretboard-scene`), `CircleOfFifths` (`circle-scene`) — token-themed GPU scenes with
particle/needle animation and accessible fallbacks.

**Phase 2 — audio-reactive + tuner.** `AudioVisualizer` (`audio-visualizer-scene`) draws a
spectrum + waveform from the master-bus `getAnalyser()`; embedded on the backing track (any player
that routes through `@/lib/audio` reacts). `TuningReference` gained a real mic tuner: `getUserMedia`
→ a dedicated `AnalyserNode` → autocorrelation pitch detection (`@/lib/pitch-detection`) → a Pixi
needle gauge (`tuner-scene`) with a green in-tune band; DOM cents-readout fallback.

**Phase 3 — notation play-head.** `useNotationPlayhead` (`use-notation-playhead.ts`) overlays a
transparent Pixi canvas on the Verovio SVG in `ScoreViewer`/`ScoreRenderer`, drawing a glow around
the sounding notes + a play-head bar. Driven by the existing rAF loop (`paint(ids)`), synced to real
note positions via `getBoundingClientRect`. **Additive** — the SVG note highlight still works; the
overlay is a decorative enhancement that no-ops without WebGL. Uses a raw (dynamically-imported)
Pixi `Application`, the right fit for an imperative, externally-driven overlay canvas.

**Phase 4 — ambient polish.** `AmbientBackground` (`ambient-scene`) drifts soft accent/muted "dust"
motes behind the home hero; static under reduced motion. `DrillFeedback` (`drill-feedback-scene`) is
a drop-in for the ear-training tools — pass `result` (`'correct'|'wrong'|null`) and each answer fires
a fixed, viewport-wide particle burst (celebration vs. muted scatter); wired into `EarTrainer`,
`ChordQualityEar`, `IntervalConstructionQuiz` (add the one-liner to more the same way).
`AnimatedCoverArt` (`cover-sparkle-scene`) lays a twinkling sparkle over the SVG `CoverArt` on the
catalogue detail hero — **single-instance only** (each canvas is a WebGL context; the grid keeps the
plain `CoverArt`).

Decorative canvases (ambient, drill-feedback, audio-visualizer, cover-sparkle) pass
`decorative` to `PixiCanvas` → the region is `aria-hidden` (not a labelled `role="img"`) with no
sr-only fallback. Interactive surfaces (keyboard, fretboard, circle, tuner) stay labelled with a real
accessible control set.

## Gotchas

- **Client-only.** Pixi touches `window`/`canvas`; it must never run during SSR. `PixiCanvas`
  enforces this by only rendering the scene after mount.
- **Dev `504 Outdated Optimize Dep`.** `pixi.js`/`@pixi/react` are lazy-imported and deliberately not
  pre-bundled (`optimizeDeps.include`) — including them pulls a duplicate React into the Vitest
  optimizer. On first use in dev, Vite optimizes them once (a `504` that self-heals on reload);
  restart the dev server or `rm -rf apps/web/node_modules/.vite` if it sticks (same class as
  verovio/smplr).
- **Single Pixi copy.** `pixi.js` + `@pixi/react` live in the pnpm catalog so one copy resolves —
  mismatched copies break `extend()`/`instanceof`.

## Testing

- **Unit** (`pnpm --filter @TheY2T/tmr-web test`): `use-theme-colors.test.ts` (RGB parsing + shape),
  `audio.test.ts` (master-bus routing / unity gain / analyser tap), `pitch-detection.test.ts`
  (autocorrelation recovers a sine's fundamental; Hz→note mapping).
- **E2E** (`e2e/pixi-keyboard.spec.ts`): canvas mount + accessible keys + axe scan. Island
  hook-components can't be unit-tested under the current `getViteConfig` env (a pre-existing
  duplicate-React limitation), so island coverage lives in this Playwright smoke.
