# ADR 0028 — Preconfigured interactive tool embeds in catalogue articles

- **Status:** accepted (shipped & browser-verified across the corpus)
- **Date:** 2026-07-15

## Context

Catalogue articles were **prose-only**: the body is Markdown rendered with `marked` →
`dangerouslySetInnerHTML`, and the only interactive element was a `ScorePlayer` attached out-of-band
when an `alphatex` media asset matched the slug (ADR 0027). Many lessons *described* something the app
already has a tool for — a scale (`minor-pentatonic-scale-shapes`), a chord set
(`ukulele-first-four-chords`), a progression (`12-bar-blues-in-a`), a theory topic (the OMT set) — but
only linked to `/tools/*` as bare text. And several items described a specific playable piece
(`amazing-grace-trad`, Hanon/Czerny studies) with no score at all. The `/tools/*` islands are generic
playgrounds that take no props and don't read query params, so they can't be pointed at a lesson.

## Decision

**Author a structured `embeds` array on a content item that renders preconfigured tool islands below
the prose.** An embed is authored inline in the content Markdown as a fenced ```embeds block (a JSON
array); the build strips it from the body and stores it in `details` JSONB.

1. **Schema, spec-first.** A flat `ContentEmbed` model (`tool` discriminator + optional per-tool config)
   in `packages/api-spec/main.tsp` → `pnpm spec:generate`; domain `ContentEmbed` in
   `catalogue/domain/content-item.ts`; `ContentDetail.embeds?: ContentEmbed[]` on the response
   (`toContentDetailView` reads `details.embeds`; the locked-preview view withholds it, like `bodyMdx`).
   A flat shape (not a per-tool discriminated union) keeps the generated Zod DTO simple; the web narrows
   on `tool`.
2. **Rides in `details` JSONB — no migration.** The seed writes `details` verbatim and the Drizzle
   mapper reads it verbatim, so `embeds` flows exactly like `related` (stored in `details`, surfaced as a
   separate top-level response field). The build parser (`build-seed-content.mjs` `extractEmbeds`)
   **fails the build** on malformed JSON or an unknown `tool`.
3. **Six embeddable tools.** `score` (`ScorePlayer` with inline alphaTex — the workhorse: any playable
   notation/tab), `scale-boxes` (`ScaleBoxes`), `keyboard` (`PianoKeyboard` scale-highlight),
   `chord-diagrams` (guitar **or** ukulele), `progression` (`ProgressionPlayer`), `circle-of-fifths`.
   Tools that had no props gained **optional initial-state props** (defaults unchanged, so the `/tools`
   pages are untouched): `ScaleBoxes(root, scale, position)`, `PianoKeyboard(defaultRoot, defaultScale)`,
   `ProgressionPlayer(chords, tempo)`. The shared `ChordDiagram` (`@TheY2T/tmr-ui/music`) was generalised
   to derive its string count from `chord.frets.length`, so it renders 4-string ukulele as well as
   6-string guitar; `GUITAR_CHORDS` gained open 7ths and a `UKULELE_CHORDS` set was added.
4. **Renderer.** `apps/web/src/components/content/ContentEmbeds.tsx` maps each embed → a **lazy-loaded**
   island (so a page only ships the tools its embeds use), each in a titled card with an optional caption.
   Rendered inside the `client:load` `ContentDetail` island, below the body/score/audio. Pure musical
   resolution (note-name → pitch class, chord lookup, tuning) is in `apps/web/src/lib/embeds.ts`
   (unit-tested).

## Consequences

- **Corpus upgraded:** every text-only catalogue item is now implemented by a preconfigured tool — 5
  hand-authored `alphatex` scores (category A), 23 tool embeds (category B), and 3 previously-empty OMT
  stubs got a full article body + embed. Bare `/tools/x` prose references were reworded to point at the
  embedded tool or made proper Markdown links.
- **Reference:** the **`embed-tool`** skill documents every tool + how to embed one; `docs/features/content-embeds.md`.
- **Validation:** `content:build` checks the embed JSON shape + `tool` name; **`scores:validate` parses
  every inline `score` embed's `tex` through alphaTab** (alongside the `.alphatex` score-media files), so
  a broken inline score fails the gate — visual/audio proofing still happens in the browser.
- **Boundaries:** generic tools (ear trainers, metronome, fretboard, etc.) remain link-only until they
  gain config props + an entry in the renderer registry. The CMS does not yet author embeds
  (file-authored, like scores).
- **Verified:** scale-boxes, guitar + ukulele chord diagrams, custom progression, inline score, and
  category-A score media all render + play across the vintage themes; `pnpm test`/`check-types`/lint
  green (web 84 tests, api 151).
