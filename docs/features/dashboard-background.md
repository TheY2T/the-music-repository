# Animated dashboard background

A personalizable, decorative PixiJS backdrop rendered behind the signed-in learner dashboard
(`/dashboard`), configured from a dedicated **Settings** page (`/settings`); the header **Settings**
gear (`SettingsMenu`) links to it for signed-in learners. Purely visual — it never
carries information or interaction — and it degrades gracefully (no WebGL → nothing renders; reduced
motion → a static frame). Built on the existing PixiJS layer (ADR 0022,
`docs/features/pixi-visualization.md`).

## What the user gets

- A **style** picker with five choices, each a distinct Pixi scene:
  - **Sound waves** (`waves`, default) — overlapping oscilloscope-style sine ribbons.
  - **Staff & notes** (`staff`) — faint five-line staves with drifting, bobbing noteheads.
  - **Piano roll** (`roll`) — soft, pill-shaped note-bars of light drifting slowly downward in
    vertical lanes, like a slowed piano roll. Distributed across the whole canvas, so it reads
    through the gaps between content cards.
  - **Dust motes** (`bokeh`) — the home-hero ambient particle drift, reused here.
  - **None** (`none`) — no canvas at all.
- An **intensity** slider (10–100) that scales opacity + element density/amplitude per scene.
- A **live preview** that reflects the draft style + intensity *before* the user commits, and an
  **Apply** button (enabled only when the draft differs from the saved preference) plus **Reset to
  default**.

## Architecture

```
SettingsMenu (header gear) ──link──▶ /settings (settings.astro, flag + auth gated)
                                       └─ <BackgroundSettings client:only="react"> (draft style + intensity, live preview, Apply/Reset)
                                             └─ <DashboardBackground style=… intensity=…/>   ← controlled = preview

/dashboard (dashboard.astro, flag + auth gated)
  └─ <DashboardBackground client:only="react"/>          ← uncontrolled = reads saved pref
        └─ <PixiCanvas decorative loader={() => import('…/bg-<style>-scene')} sceneProps={{intensity}}/>
```

- **Preference model — `src/lib/dashboard-background.ts`.** Pure, SSR-safe get/set over
  `localStorage` (`tmr.dashboardBg.style` / `tmr.dashboardBg.intensity`), mirroring the
  theme/instrument preference pattern. Intensity is clamped 0–100; an unknown stored style falls back
  to the default. This module is the single source of truth for styles + defaults.
- **`DashboardBackground.tsx`** maps a style → a lazy scene loader and renders a `decorative`
  `PixiCanvas`. With no props it reads the saved preference on mount and live-updates via the
  `storage` + `tmr:dashboard-bg-change` events (so applying in `/settings` updates an open dashboard).
  With `style`/`intensity` props it is *controlled* — the settings preview uses this. It is keyed on
  the style so switching remounts the (once-captured) scene loader.
- **`BackgroundSettings.tsx`** holds the draft and drives the preview; **Apply** persists via
  `setBackgroundPref`, fires `tmr:dashboard-bg-change`, and toasts. It is an app island, so it calls
  `t()` directly (i18n-by-prop is for the library).
- **Scenes** live in `src/lib/pixi/`: `bg-waves-scene`, `bg-staff-scene`, `bg-roll-scene`, and the
  reused `ambient-scene` (accepts an optional `intensity`). Each reads theme colours via
  `useThemeColors()`, keeps the canvas transparent, and renders a single static frame under
  `prefers-reduced-motion`.

## Flag, i18n, nav

- **Flag:** `personalization.dashboard-background` (`FlagKeys.DashboardBackground`, default on) gates
  both the `/settings` route and the dashboard rendering, and the nav entry.
- **i18n:** all strings under `settings.*` in `@TheY2T/tmr-i18n-locales` (English + `zh-Hans`).
- **Nav:** the header **Settings** gear (`SettingsMenu`) shows a "Dashboard background" link for
  signed-in learners — `BaseLayout` passes `backgroundHref` when the flag is on and a user is present.

## Design system

Adds a **`Slider`** atom to `@TheY2T/tmr-ui` (styled native `<input type="range">`, semantic tokens,
themed thumb + filled track) with a Storybook story in `Atoms → FormControls`.

## Testing

- **Unit:** `src/lib/dashboard-background.test.ts` — clamping, defaults, round-trip, unknown-style
  fallback.
- **E2E:** `e2e/dashboard-background.spec.ts` — anonymous redirect; signed-in learner picks a style +
  intensity, applies, the preview + dashboard mount a canvas, and **None** removes it. Pixi islands
  can't be unit-tested (duplicate-React under `getViteConfig`), so island coverage is E2E.

## Gotchas

- The dashboard mounts `DashboardBackground` with `client:only="react"` inside a `relative` wrapper;
  the canvas sits `absolute inset-0 z-0` and the content sits `relative z-10`. The wrapper is
  transparent, so the canvas paints over the page background and under the (opaque) content cards.
- Intensity is stored 0–100 but scenes take a 0–1 `intensity` sceneProp — `DashboardBackground`
  divides by 100 at the boundary.
