# CLAUDE.md — apps/web (Astro)

Astro SSR + React islands + Tailwind v4 + shadcn/ui. See root `CLAUDE.md` for repo-wide rules.

## Structure

```
src/
  pages/*.astro        # routes (lowercase/kebab, [slug].astro for dynamic)
  components/*.tsx      # React islands (PascalCase files)
  components/ui/*.tsx   # shadcn components (Button, ...)
  lib/utils.ts          # cn() helper
  styles/global.css     # Tailwind v4 (@import) + shadcn tokens + dark mode (.dark)
  middleware.ts         # OpenFeature SSR eval → Astro.locals.flags (per request)
  env.d.ts              # App.Locals typing
```

## Islands rules

- **One island root per interactive unit.** Context-dependent shadcn (Dialog, Select, Tabs, Toast)
  must be composed inside a single `.tsx` island — React context does not cross island boundaries.
- Hydrate minimally: `client:load` only where immediately interactive; else `client:visible`/`idle`.
- Static markup stays in `.astro`.

## Auth (Slice 2, ADR 0013)

- **Client:** `src/lib/auth-client.ts` (`createAuthClient` → `authClient.signIn/signOut/useSession`).
  Points at the API (`PUBLIC_API_BASE_URL`), `credentials: 'include'` (cross-origin cookie in dev).
- **SSR session:** `src/middleware.ts` forwards the request cookie to the API's `get-session` and sets
  `Astro.locals.user` (null when anonymous). Gate a page with
  `if (!Astro.locals.user) return Astro.redirect('/signin?redirect=…')`.
- **Same-site cookie (dev):** web `:4321` and API `:3000` share the site (cookies ignore port), so the
  `SameSite=Lax` session cookie reaches both. The gate is UX-only — the API re-authorizes mutations.
- Sign-in island: `SignInForm.tsx`; sign-out: `SignOutButton.tsx`; gated page: `pages/admin/index.astro`.

## Admin CMS (Slice 2b)

- **Pages** under `pages/admin/` (list + `content/new` + `content/[slug]/edit`), each gated by
  `guardAdmin(Astro)` (`src/lib/admin-guard.ts`): checks the `admin.cms` flag + editor/admin role.
- **Islands:** `AdminContentList.tsx`, `ContentForm.tsx` (Markdown editor + `marked` live preview,
  taxonomy datalists, media uploader).
- **API calls** go through `src/lib/admin-api.ts` — a typed, credentialed fetch wrapper over the CMS
  endpoints (uses generated model types from `@TheY2T/tmr-api-client`). Media upload = request a
  presigned ticket, then `uploadToTicket` PUTs the file straight to MinIO.
- The generated `customFetch` mutator sends `credentials: 'include'` so authed hooks carry the cookie.

## Favorites (Slice 2c)

- **`src/lib/favorites-api.ts`** — credentialed list/add/remove helpers.
- **`FavoriteHeart.tsx`** (presentational, optimistic) is reused by the catalogue grid
  (`CatalogueBrowser` owns a favorited-slug `Set`, seeded via `listFavoriteSlugs`) and the detail-page
  island **`FavoriteButton.tsx`**. **`MyFavorites.tsx`** backs `/me/favorites`.
- Hearts/pages are gated on `Astro.locals.flags.favorites && !!Astro.locals.user` (props passed from
  the page frontmatter). Anonymous users see no hearts.

## Collections (Phase 2)

- Public: `/collections` + `/collections/[slug]` (islands `CollectionsBrowser`/`CollectionDetail` via
  generated hooks), flag-gated on `learning.collections`.
- Admin: `/admin/collections/*` (guard + `learning.collections`) — `AdminCollectionList` +
  `CollectionForm` (ordered content slugs, one per line; save = update metadata + `setItems`). API via
  `collectionsAdminApi` in `src/lib/admin-api.ts`.

## Progress (Phase 2)

- `src/lib/progress-api.ts` — credentialed get/mark/log helpers.
- `CompleteButton.tsx` (detail-page toggle) + `ProgressDashboard.tsx` (`/me/progress`: stats,
  per-collection bars, log-practice form). Gated on `learning.progress` + login.
- **Tool practice logging:** `ToolPracticeLogger.tsx` — an invisible `client:load` island on every
  `/tools/*` page that counts **tab-visible** time and flushes whole minutes via `logPractice()`
  (`POST /me/practice`), feeding the dashboard's streak + practice minutes. Each page computes
  `logPracticeEnabled = flags.toolPractice && flags.progress && !!user` and renders the island only
  then (`learning.tool-practice` flag). Wired identically into all tool pages next to `<InfoView>`.

## Info View (Phase 2)

- `InfoView.tsx` — persistent, dismissible help panel; preloads `/help-topics` and resolves
  `data-help="<slug>"` on hover/focus via **document event delegation** (works across islands).
  Add `data-help` to any element; style comes from the global `[data-help]` rule. `src/lib/help-api.ts`
  has the public list/get + `helpAdminApi`.
- Admin: `/admin/help/*` (`AdminHelpList` + `HelpTopicForm`). Gated on `learning.info-view`.

## Interactive tools (Phase 3)

- Client-side only — no API. `src/lib/music-theory.ts` (pure 12-TET helpers) + `src/lib/audio.ts`
  (dependency-free Web Audio player + `scheduleClick` for the metronome's lookahead scheduler).
- Fifteen tools live under `pages/tools/` (keyboard, fretboard, circle of fifths, scale explorer,
  chord builder, chord identifier, mode explorer, progression builder, metronome, tuner, interval
  explorer, staff reader, ear trainer, beat sequencer, sight-reading), each gated on its `tools.*` flag
  (redirect to `/tools` when off). New tools drop into the `/tools` hub the same way. Tool terms carry
  `data-help` to feed the Info View. `StaffSequence` renders a row of notes for the staff/sight-reading tools.

## Play-along (Phase 5)

- Backing-track generator at `/tools/backing-track` (gated on `tools.backing-track`). Client-side only,
  reusing `src/lib/audio.ts` + `music-theory.ts`. `BackingTrack.tsx` runs a lookahead scheduler (same
  pattern as the metronome/sequencer) that arranges drums + walking bass + comping chords from a
  progression (`{rootOffset, intervals, roman, suffix}` per bar) × key × tempo, all changeable live via
  refs; per-part mute checkboxes. New primitive: `scheduleTone(freq, atTime, duration, {type, gain})` in
  `audio.ts` for precisely-timed bass/chord notes.
- Voicing library at `/tools/voicings` (gated on `tools.voicings`). `VoicingLibrary.tsx` builds standard
  voicings (close, inversions, drop-2/3, shell for 7ths; open for triads) via pure array math local to
  the component (`invert`/`drop`) and renders each on a fixed 3-octave keyboard diagram with lit + named
  tones + play/arpeggiate.
- Notation player at `/tools/player` (gated on `tools.notation-player`). `NotationPlayer.tsx` renders a
  PD melody via `StaffSequence` (which gained a backward-compatible `activeIndex` prop for the cursor)
  and steps a recursive `setTimeout` cursor in sync with `playTone`; tempo / loop / section read from
  refs so they change live. No notation library.
- Lick library at `/tools/licks` (gated on `tools.licks`). `LickLibrary.tsx` holds curated licks
  (`Step[]` of `{string, fret}`) rendered as interactive tab (column highlight during playback);
  fret→pitch via `STANDARD_TUNING`, playback via `playTone` on a ref-driven `setTimeout`. Tab notes may
  carry `bend`/`slideTo` (rendered `7b` / `5/7`, played via `playGlide`).
- The notation player transposes via `staffPlacement(midi, flats)` (music-theory) — `StaffSequence`
  renders the returned `accidental` (♯/♭) glyph. `audio.ts` has `playGlide(from, to, dur)` for
  bends/slides. `StaffSequence` also takes an optional per-note `beats` → draws note-value glyphs
  (open/filled head, stem, flag, dot); a `rest` note draws a hand-drawn SVG rest (quarter/half/eighth —
  **not** unicode glyphs, which render as tofu in the system font). Omit `beats`/`rest` and notes render
  as plain heads (backward-compatible). Lick tab notes also support `legatoTo` (`5h7`/`7p5`); the lick
  library has a **speed trainer** (loop + tempo ramp).
- Chord diagrams at `/tools/chord-diagrams` (gated on `tools.chord-diagrams`) — `ChordDiagrams.tsx`
  renders curated open/barre guitar shapes as SVG fret grids (low E left), click to strum. It **exports**
  `GUITAR_CHORDS`, `ChordShape`, `ChordDiagram`, and `strumChord(frets, direction)` for reuse.
- Strumming trainer at `/tools/strumming` (gated on `tools.strumming`) — `StrummingTrainer.tsx` loops a
  strum pattern (↓/↑/· eighth slots) over a chord, reusing the chord exports. The notation player has a
  **Click** metronome toggle (independent beat timer via `scheduleClick`).
- Fingerpicking trainer at `/tools/fingerpicking` (`tools.fingerpicking`) — `FingerpickingTrainer.tsx`
  loops per-string picking patterns (bass/alt-bass + treble) over a chord, reusing the chord exports.
- Arpeggio player at `/tools/arpeggio` (`tools.arpeggio`) — `ArpeggioPlayer.tsx` loops a chord's tones
  one-at-a-time in a chosen direction (up/down/up-down).
- Backlog tools (from `docs/backlog.md`): Chord analyzer `/tools/analyzer` (`tools.analyzer`,
  `analyzeChordInKey`) and Transposer & capo `/tools/transposer` (`tools.transposer`, `capoSuggestions`).
  The analyzer also does **reharmonization** (`reharmonizations` in `music-theory.ts` — per-chord
  tritone sub / relative maj-min / secondary dominant / modal interchange, hear + apply) and **saves
  progressions to the account** when signed in: `src/lib/progressions-api.ts` (credentialed
  `/me/progressions` PUT/GET/DELETE) behind the `personalization.saved-progressions` flag; the
  `analyzer.astro` page passes `syncEnabled = savedProgressions && !!user` and `ChordAnalyzer` branches
  between the API and `saved-progressions.ts` (localStorage) accordingly. See
  `docs/features/saved-progressions.md`. Backend: `apps/api/src/progressions/` (`ProgressionLibrary`
  port + Drizzle `saved_progressions`).
- **Web MIDI:** `src/lib/use-midi-input.ts` (`useMidiInput` hook, built-in Web MIDI types, no dep) is
  wired into `PianoKeyboard` (live notes highlight + sound) and `ChordIdentifier` (held notes ∪ manual
  toggles → live detection). Reuse the hook elsewhere (ear-trainers). Verify MIDI in Playwright by
  mocking `navigator.requestMIDIAccess` via `addInitScript` (`browser_run_code_unsafe`) then dispatching
  `onmidimessage`.
- Bass-line generator `/tools/bassline` (`tools.bassline`) — roots / root-fifth / walking bass over a
  progression (`scheduleTone` sine bass + hihat).
- Ear-trainer answers by MIDI (play the 2 notes → interval); Metronome has subdivisions + a polyrhythm
  layer. More backlog tools: melodic/rhythm dictation, groove library, solfège, key-signature quiz
  (`tools.melodic-dictation` / `.rhythm-dictation` / `.grooves` / `.solfege` / `.key-quiz`). All reuse
  `music-theory.ts` / `StaffSequence` / `audio.ts`. See `docs/backlog.md` for what's done vs open.
- Progression play-along at `/tools/progression-player` (`tools.progression-player`) — loops a chord
  progression one bar per chord (reuses the chord exports + `strumChord`).
- Rhythm trainer at `/tools/rhythm` (`tools.rhythm`) — `RhythmTrainer.tsx` plays a one-bar rhythm over a
  click, reusing `StaffSequence`'s note-value glyphs on the middle line.
- CAGED explorer `/tools/caged` (`tools.caged`) — 5 movable shapes for a major chord (C-major data +
  uniform transpose). Scale positions `/tools/scale-boxes` (`tools.scale-boxes`) — fretboard box window.
  Song player `/tools/song` (`tools.song`) — melody (StaffSequence) + per-bar `strumChord` accompaniment.
  Progression ear-training `/tools/progression-ear` (`tools.progression-ear`) — `diatonicChords` quiz.
  Chord ear-training `/tools/chord-quality-ear` (`tools.chord-quality-ear`) — name a chord's quality.
  Fretboard quiz `/tools/fret-quiz` (`tools.fret-quiz`) — name a highlighted fret.
- **Dependency-free "heavy" tools:** MusicXML import `/tools/musicxml` (`tools.musicxml`) — `DOMParser`
  → `StaffSequence`. Multi-voice engraving `/tools/multi-voice` (`tools.multi-voice`) — self-contained
  stacked-notehead staff of diatonic triads. Practice player `/tools/practice-player`
  (`tools.practice-player`) — `HTMLAudioElement.playbackRate` + `preservesPitch` (pitch-preserving) +
  A–B loop, on a locally-loaded file. See `docs/features/play-along.md`.
- **Integrative + library tools (latest backlog batch):** Interval-construction quiz `/tools/interval-quiz`
  (`tools.interval-quiz`). Practice room `/tools/practice-room` (`tools.practice-room`) — a looping
  band (drums + walking bass + comping) over a progression with the current chord diagram + beat cursor,
  reusing `scheduleDrum`/`scheduleTone` + the chord-diagram exports. The metronome gained **tap-tempo**;
  the chord analyzer saves/loads named progressions to `localStorage` via `src/lib/saved-progressions.ts`
  (`tmr.savedProgressions`).
- **The two library tools (first runtime deps in web):**
  - Score rendering `/tools/score` (`tools.score`) — `ScoreRenderer.tsx` **dynamic-imports `verovio/esm`
    + `verovio/wasm`** (`new VerovioToolkit(await createModule())`) to engrave MusicXML/MEI → SVG
    (rendered via `dangerouslySetInnerHTML`; the markup is Verovio's own trusted output). Verovio ships
    no types for its subpath exports → `src/verovio.d.ts` declares them. **Notation-synced playback:**
    a Play button + speed slider — `renderToTimemap` + `getMIDIValuesForElement` schedule the audio
    (`scheduleTone`), and an rAF loop calls `getElementsAtTime(scoreMs)` to paint the sounding note ids
    red on the engraved SVG (scoped to the container ref — Verovio emits a defs `<svg>` too). Note ids
    from the toolkit match the SVG `g.note` ids.
  - Sampled instruments `/tools/soundfont` (`tools.soundfont`) — `SoundfontPlayer.tsx` over
    `src/lib/soundfont.ts`, which **lazily `import('smplr')`** and loads a GM `Soundfont`. Samples stream
    from a CDN, so `loadSoundfont` catches failures and returns `'fallback'`; `playNote` then uses the
    oscillator engine (`playTone`) so the keyboard always sounds. Also plays live `useMidiInput`.
  - **Vite gotcha:** after `pnpm add`-ing a browser library (verovio/smplr), the running Astro dev
    server must be restarted (or `rm -rf apps/web/node_modules/.vite`) so Vite re-optimizes deps —
    otherwise islands fail to hydrate with `504 Outdated Optimize Dep` / `_jsxDEV is not a function`.

## Trainers / drills (Phase 4)

- SRS drills at `/drills` (gated on `trainers.srs` + login). **Decks are client-side**
  (`src/lib/drill-decks.ts`): card key + `play(card)` (question audio, reusing Phase-3 audio/theory) +
  `answer(card)`. `src/lib/reviews-api.ts` calls the SM-2 backend; `DrillsHub` + `ReviewSession` islands.
  The server only stores scheduling state (see ADR 0014) — add a deck without touching the backend.

## Monetization / premium (Phase 6)

- `src/lib/subscription-api.ts` — credentialed `getSubscription`/`activatePremium`/`cancelPremium`.
- `UpgradePanel.tsx` backs `/upgrade` (gated on `premium` flag + login) — a **mock checkout** (Free →
  Activate → Premium active/Cancel; staff see a note, no button).
- Premium gating is driven by the API's `item.locked`: a 🔒 Premium badge on catalogue cards
  (`CatalogueBrowser`) and a locked upgrade panel on the detail page (`ContentDetail`). No client-side
  entitlement logic — the API decides. Home shows a "Premium" link when logged in + flag on.
- **Classrooms (teacher mode, `education.classrooms`):** `src/lib/classrooms-api.ts` +
  `ClassroomsManager.tsx` on `/classrooms` (login + flag gated). The "Manage" panel does create / join
  by code / roster (remove member, make-owner) / grant premium / **assign content by slug** / **class
  progress** (per-student completedCount) / archive / leave. Home shows a "Classrooms" link. See
  `docs/features/classrooms.md`.

## Feature flags

- **SSR:** `src/middleware.ts` sets the flagd provider and evaluates flags per request into
  `Astro.locals.flags`. Pass values into islands as **props** so first paint matches the server.
- **Island:** `src/components/FlagBanner.tsx` shows the react-sdk pattern (`OpenFeatureProvider` +
  `useFlag`). Phase 3 swaps the seeded InMemoryProvider for the OFREP web provider (live updates).

## Styling

Tailwind v4 is configured in CSS (`@import "tailwindcss"` + `@theme inline`), not a JS config.
shadcn config is `components.json`. Dark mode = `.dark` on `<html>`, set pre-paint in the layout.

## Commands

`pnpm --filter @TheY2T/tmr-web dev|build|preview|check-types|lint|test`
