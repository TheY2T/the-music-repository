---
name: add-score
description: Author a new interactive score for The Music Repository in alphaTex (alphaTab's native notation format) — piano grand-staff or guitar — wire it into the file-based pipeline, and verify it renders + plays. Use when adding or fixing sheet music for a catalogue item. See docs/features/scores.md + ADR 0027.
---

# add-score

alphaTab is the **single** score engine (ADR 0027). Scores are authored as **alphaTex** text files,
bundled to `seed-scores.ts`, and rendered + played by the web `ScorePlayer`. A piece shows a score iff
it has an `alphatex` media asset, joined to the content item **by slug**.

## 1. Author the alphaTex

Create `apps/api/src/infrastructure/database/content/scores/<slug>.alphatex`, where `<slug>` matches an
existing `content_items` slug (see `seed-data.ts`). alphaTex primer:

- **Metadata:** `\title "…"`, `\tempo 96`. **Durations:** `:1 :2 :4 :8 :16` (whole…16th); a `:N` sets
  the duration for following beats, or append per-beat `C4.8`. **Bars** separated by `|`. **Rest** = `r`.
  **Chord** = `(c4 e4 g4)`. **Pitched note** = tone+accidental+octave (`C4`, `C#4`, `Eb4`).

**Piano grand staff** (two `\staff{score}` blocks; bass staff gets `\clef F4`):
```
\title "Example" \tempo 96
.
\track "Piano"
  \staff{score} \tuning piano \instrument acousticgrandpiano
  :4 c4 d4 e4 f4 | :2 g4 c5 |
  \staff{score} \tuning piano \clef F4
  :1 c3 | c3 |
```

**Guitar** — for real tablature the staff must be **stringed** (give it a tuning); alphaTab then places
pitched notes on strings, or you can write `fret.string` directly:
```
\title "Study" \tempo 100
.
\track "Guitar"
  \staff{tabs score} \tuning (E4 B3 G3 D3 A2 E2)
  :8 3.5 0.4 2.4 0.3 | :4 (0.2 2.4) r |
```

## 2. Provenance sidecar

Create `<slug>.meta.json` (see `ScoreMeta` in `content-details.ts`):
```json
{ "origin": "hand-authored", "source": "The Music Repository",
  "sourceUrl": "https://imslp.org/…", "license": "CC BY-SA 4.0",
  "attribution": "Engraving: The Music Repository (after <composer>, public domain)",
  "displayMode": "tab" }
```
`displayMode` is optional — omit to let the item's instruments pick it (`resolveDisplayMode`: piano →
`standard`, fretted → `tab`). **Licensing:** ship only CC0 (OpenScore) or hand-authored (ours). Never
MuseScore uploads, CCARH kern (NOASSERTION), or thesession ABC (ODbL/anti-LLM).

## 3. Build + validate

- `pnpm --filter @TheY2T/tmr-api scores:build` → regenerates `seed-scores.ts`
  (`SCORE_ALPHATEX` + `SCORE_META`).
- `pnpm --filter @TheY2T/tmr-api scores:validate` → re-parses each alphaTex via alphaTab (asserts a
  non-empty score). **Converting legacy MusicXML?** `scores:migrate` does it losslessly.

## 4. Seed + verify (Definition of Done)

- Reseed (`pnpm --filter @TheY2T/tmr-api build && … db:seed`) so the `alphatex` media asset lands.
- Open `/catalogue/<slug>` in a real browser: notation renders, Play works, tempo/scrub/loop respond,
  Download PDF opens the print dialog. Guitar → tab shows only if the staff is stringed (§1).
- Update `docs/features/scores.md` status if you added a new tier of piece.

## Gotchas
- alphaTab is **client-only** (Worker + AudioWorklet) + lazy-imported; font/soundfont are self-hosted at
  `/font` + `/soundfont` by the `@coderline/alphatab-vite` plugin — no CDN.
- Don't hand-edit `seed-scores.ts` (generated). Author the `.alphatex` + `.meta.json` and rebuild.
- Notation glyph colors follow the theme via `use-alphatab-theme.ts` — don't hardcode colors.
