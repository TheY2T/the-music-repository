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
  bends/slides. See `docs/features/play-along.md`.

## Trainers / drills (Phase 4)

- SRS drills at `/drills` (gated on `trainers.srs` + login). **Decks are client-side**
  (`src/lib/drill-decks.ts`): card key + `play(card)` (question audio, reusing Phase-3 audio/theory) +
  `answer(card)`. `src/lib/reviews-api.ts` calls the SM-2 backend; `DrillsHub` + `ReviewSession` islands.
  The server only stores scheduling state (see ADR 0014) — add a deck without touching the backend.

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
