# ADR 0044 — Instrument customization (fullscreen, skins, guitar handedness, per-user preferences)

- **Status:** accepted
- **Date:** 2026-07

## Context

The interactive piano and guitar tools rendered at a fixed small height, in a single theme-driven
style, and only right-handed. There was no fullscreen affordance, no way to restyle an instrument, and
no left-handed orientation for guitar — and no per-user preference store at all (the only existing
"preference", the dashboard background, is localStorage-only). We wanted to make the flagship instrument
tools more immersive and inclusive: fullscreen, instrument skins in three families (theme-token,
realistic material, PixiJS-rendered), and guitar left/right handedness across both the live tools and
the chord diagrams shown in catalogue content — with choices that stick per user.

## Decision

1. **One flag, `learning.instrument-customization`.** Gates all three capabilities together. Off ⇒ the
   tools render exactly their base view (right-handed, `theme` skin, no controls), so the change is inert
   until enabled per environment.

2. **Skins are pure data in `@TheY2T/tmr-music-core`, not CSS.** `instrument-skins.ts` holds
   `KEYBOARD_SKINS` / `FRETBOARD_SKINS` registries with `0xRRGGBB` palettes. The Pixi piano/fretboard
   scenes consume the numbers directly (merged over the live `useThemeColors()` tokens, so the `theme`
   skin keeps re-theming and material/pixi skins apply a fixed palette); SVG/DOM surfaces read the same
   values as `#rrggbb` via `toHexColor`. This keeps a single source of truth and avoids a parallel
   `skins.css` that would duplicate the palettes (a duplication the repo conventions warn against).
   `pixi`-kind skins add GPU flourishes (gloss / wood grain) drawn in the scene.

3. **Handedness is a horizontal mirror, threaded as one prop.** `handedness: 'left' | 'right'` flows
   through the SVG `ChordDiagram` (mirrored `stringX` + position-label side), the Pixi `fretboard-scene`
   (mirrored fret-column X, nut, and string-name gutter), the `GuitarFretboard` DOM fallback, the
   `ScaleBoxes` grid, and the `Fingering` embed. Content chord diagrams and fingering charts read the
   preference through the shared provider so authored articles honour the learner's choice. String
   vertical order and fret numbering are unchanged; only the neck mirrors.

4. **Fullscreen uses the native Fullscreen API via a presentational boundary.** `useFullscreen` +
   `ToolStage` live in `@TheY2T/tmr-ui` (strictly presentational, i18n-by-prop). `ToolStage` owns the
   fullscreen element and hands its body the `isFullscreen` flag (render-prop) so a fixed-height canvas
   switches to a fill layout; the button hides where the API is unavailable. Entering requires a user
   gesture, so the persisted `fullscreen` preference is remembered, not auto-applied on load.

5. **Preferences persist through a new hexagonal `preferences/` module + a `user_preferences` table.**
   Modeled on `progressions/`: spec-first `GET`/`PUT /me/preferences` (`@RequireAuth` +
   `@RequireFlagsEnabled`), a `UserPreferences` port ← `DrizzleUserPreferences`, and a single-row-per-user
   JSONB blob. The web side adds `@TheY2T/tmr-web-acl/preferences-api` (credentialed fetch) and an
   `InstrumentPreferencesProvider` / `useInstrumentPreferences()` context that seeds from `localStorage`
   for instant paint, hydrates from the account when signed in, and writes through to both. Anonymous
   visitors get a device-local copy; the hook degrades to read-only defaults outside a provider so
   embeds and tools stay safe.

## Consequences

- New per-user store: `user_preferences` (migration in `apps/api/drizzle/`), the first general per-user
  preferences table. Future small UI prefs can extend the JSONB blob rather than adding columns.
- `AppProviders` now mounts the preferences provider around every interactive region; content chord
  diagrams therefore honour handedness even without the flag (the preference is only ever set to `left`
  when the flag was on). Standalone guitar tool pages (`fretboard`, `scale-boxes`, `chord-diagrams`) are
  wrapped so they read the preference.
- Skins are scoped to the Pixi piano + fretboard instruments and the SVG chord diagrams; the other
  fret-grid game/quiz tools keep the base view. Adding a skin is a data-only change to the registry (plus
  a `skin.*` i18n key).
- Handedness/skin ids are plain strings across the boundary; unknown ids fall back to the default skin at
  render, so the backend does not need to validate against the registry.
