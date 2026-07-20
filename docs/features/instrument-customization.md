# Feature: Instrument customization (fullscreen · skins · handedness)

- **Phase:** 5 · **Status:** shipped
- **Flag key:** `learning.instrument-customization` (from `@TheY2T/tmr-flags`) → web field
  `instrumentCustomization`

## Purpose

Makes the interactive piano and guitar tools more engaging and inclusive. Learners can take a tool
fullscreen for practice, restyle the instrument (theme-token, realistic material, or PixiJS-rendered
skins), and — for guitar — flip the fretboard and chord diagrams to a left-handed orientation. Choices
persist to the account (with a device-local fallback for anonymous visitors) so they carry across
sessions and pages.

## UX behaviour

When `instrumentCustomization` is on, the piano (`/tools/keyboard`) and guitar (`/tools/fretboard`)
tools gain a toolbar above the instrument:

- **Cinema mode** — a theater-mode toggle (like a video player's) that full-bleeds the tool to the
  browser width in-page and enlarges its canvas, without leaving the page (the header/nav stay visible).
  The piano uses its aspect-correct stage layout + effects at this size.
- **Fullscreen** — a maximize/minimize button using the browser's native Fullscreen API. The stage
  fills the viewport with an opaque background and the canvas grows to fill it; the button is hidden
  where the API is unavailable. Entering fullscreen requires a user gesture, so the saved `fullscreen`
  preference reflects the learner's choice rather than auto-entering on load. In fullscreen the **piano**
  becomes a performance stage: an aspect-correct keyboard pinned to the bottom, with the space above
  turned into a reactive effects region — a colour-per-note light beam and a rising particle fountain for
  every held key (skipped under `prefers-reduced-motion`). The Pixi scene resizes to its container, so the
  keys keep their proportions instead of stretching.
- **Skin** — a picker of instrument skins. Piano: `theme`, `classic` (ebony & ivory), `vintage-wood`,
  `neon` (Pixi gloss). Guitar: `theme`, `natural`, `sunburst`, `ebony`, `metallic` (Pixi gloss). The
  `theme` skin follows the site's vintage aesthetics × light/dark; material/pixi skins apply a fixed
  palette (and, for `pixi` skins, gloss/wood-grain flourishes).
- **Handedness** (guitar only) — right/left. Left mirrors the interactive fretboard horizontally (nut on
  the right), the DOM fallback grid, the scale-box grid, and every chord diagram — including the chord
  diagrams and fingering charts embedded in catalogue articles.

When the flag is off, the tools render their base view: right-handed, the `theme` skin, no controls.

## Data model

`user_preferences` (`apps/api/src/infrastructure/database/schema.ts`) — one row per user:
`user_id` (PK, FK → `user.id`, cascade), `prefs` JSONB
(`{ handedness, keyboardSkin, fretboardSkin, fullscreen }`), `updated_at`. Anonymous visitors keep the
same shape in `localStorage` (`tmr.instrument.*`).

Skin registries are pure data in `@TheY2T/tmr-music-core/instrument-skins` (`KEYBOARD_SKINS` /
`FRETBOARD_SKINS`, `0xRRGGBB` palettes consumed directly by the Pixi scenes; `toHexColor` for SVG/DOM).

## API contract

Spec-first in `packages/api-spec/main.tsp` → `@TheY2T/tmr-contracts`:

- `GET /me/preferences` → `InstrumentPreferencesView` (falls back to defaults when none saved).
- `PUT /me/preferences` (`UpdatePreferencesBody`) → the stored view.

Both `@RequireAuth()` + `@RequireFlagsEnabled(InstrumentCustomization)`; the acting user comes from the
`CurrentUser` port. Hexagonal module: `apps/api/src/preferences/` (`UserPreferences` port ←
`DrizzleUserPreferences`). The web app reads/writes through
`@TheY2T/tmr-web-acl/preferences-api` + the `InstrumentPreferencesProvider` /
`useInstrumentPreferences()` context (`@TheY2T/tmr-web-acl/instrument-preferences`), mounted by
`AppProviders` around each interactive region.

## Help topics

None registered.

## Tests

- **Unit:** `packages/music-core/src/instrument-skins.test.ts` (registry resolution + `toHexColor`);
  `apps/api/src/preferences/application/use-cases/preferences.use-case.test.ts` (get defaults/stored,
  update delegation with a mocked port).
- **Component:** `packages/musickit-ui/src/organisms/chord-diagram.test.tsx` (left-handed mirrors the
  string columns + position label side).
- **Integration:** `apps/api/src/preferences/infrastructure/drizzle-user-preferences.integration.test.ts`
  (Testcontainers Postgres — upsert/read round-trip; `pnpm test:integration`).
- **E2E:** `apps/web/e2e/instrument-customization.spec.ts` (base view with the flag off; skin/handedness/
  fullscreen controls when enabled).

Verify end-to-end: enable `learning.instrument-customization` in `/admin/feature-flags`, open
`/tools/fretboard` — toggle left-handed and confirm the board + a catalogue article's chord diagram
mirror; switch skins; enter/exit fullscreen. Signed in, reload → persisted; signed out → the
localStorage copy still applies.
