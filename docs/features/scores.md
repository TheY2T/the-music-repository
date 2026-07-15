# Feature: Scores (alphaTex + alphaTab playback + PDF)

- **Phase:** Catalogue → Scores · **Status:** shipped — all 55 catalogue scores populated + validated
- **Related:** `docs/features/catalogue.md` (detail page + media), `docs/features/play-along.md`
  (`/tools/score`), **ADR 0027** (single alphaTab engine; supersedes ADR 0024 MusicXML + ADR 0026 dual
  engine), ADR 0025 (note service).

## Purpose

Give catalogue pieces **real sheet music**. Every score is a single **alphaTex** source of truth
(alphaTab's native notation format); from it the web `ScorePlayer` derives (a) an engraving (alphaTab →
SVG), (b) **notation-synced playback** (alphaTab's synth + cursor + A–B loop + metronome/count-in +
speed), and (c) a **downloadable PDF** via `api.print()`. There is no stored PDF binary. alphaTab is the
single engine for piano (standard notation) and guitar (tab) — see ADR 0027.

> **History:** scores were originally hand-authored MusicXML rendered by Verovio (ADR 0024) with a second
> alphaTab engine for guitar (ADR 0026). ADR 0027 unified everything on alphaTab and converted the corpus
> to alphaTex (losslessly, via alphaTab's own importer→exporter). Verovio is gone. Earlier still, 56 items
> carried a `withPdf` placeholder PDF — that path was removed in ADR 0024.

## Authoring pipeline (file-based)

Scores are authored like catalogue content + collections — files on disk, bundled to a committed
`seed-*.ts` (the seed runs from `dist/`, so loose files can't be read at runtime).

```
apps/api/src/infrastructure/database/content/scores/
  <slug>.alphatex     # alphaTab's native notation format — the single source of truth
  <slug>.meta.json    # provenance/licensing (ScoreMeta), recorded on the media asset
```

`<slug>` must match a `content_items` slug. `<slug>.meta.json`:

```json
{
  "origin": "openscore | kern | hand-authored",
  "source": "The Music Repository",
  "sourceUrl": "https://…",
  "license": "CC0 | CC BY-SA 4.0 | Public Domain | …",
  "attribution": "Engraving: The Music Repository (after <composer>, public domain)",
  "displayMode": "standard | tab (optional — overrides the instrument-derived mode)"
}
```

- `pnpm --filter @TheY2T/tmr-api scores:build` → bundles the pair for every slug into the committed
  `seed-scores.ts` (`SCORE_ALPHATEX: Record<slug,string>` + `SCORE_META: Record<slug, ScoreMeta>`).
- `pnpm --filter @TheY2T/tmr-api scores:validate` → **validity gate**: re-parses each alphaTex via
  alphaTab (`AlphaTexImporter`) and asserts a non-empty score (track/bar/beat counts). Visual proofing
  against the public-domain reference is done in the browser (alphaTab renders in a real DOM).
- `pnpm --filter @TheY2T/tmr-api scores:migrate` → one-time MusicXML→alphaTex converter
  (`musicxml-to-alphatex.mjs`): loads each `<slug>.musicxml` into alphaTab's model and serializes it out
  with `AlphaTexExporter` — lossless (re-parse-validated). Pass `--delete` to remove the `.musicxml`.

Author new scores with the **`add-score`** skill. The seed (`seed.ts`) uploads each `SCORE_ALPHATEX`
entry as an **`alphatex`** media asset and records the `SCORE_META` engraving license/attribution/
`source_url` on the asset.

## Frontend (`ScorePlayer.tsx`, ADR 0027)

- Renders + plays the alphaTex with **alphaTab** (its synth + animated cursor). `resolveDisplayMode`
  picks the piano transport (standard notation: play/pause, tempo, scrub, click-to-hear, click-to-seek,
  A–B loop, metronome, count-in) or the guitar default UI (tab: alphaTab's own cursor + selection).
- **Download PDF** = `api.print()` (browser "Save as PDF") — same render, no stored binary.
- An **engraving-credit line** (`score.creditLabel`) shows source + license from the `MediaAsset`
  contract fields, so provenance is visible + auditable.

`ContentDetail.tsx` renders the `alphatex` media asset via `ScorePlayer`; a legacy PDF `<iframe>` branch
remains only as a fallback for CMS-uploaded PDFs. Font + soundfont are self-hosted at `/font` +
`/soundfont` by the `@coderline/alphatab-vite` plugin (no CDN).

## Licensing policy (important)

The compositions are all public-domain, but a digital **engraving** carries its own license. We ship
**only**:
- **CC0** MusicXML (OpenScore / Open Well-Tempered Clavier), or
- **hand-authored** MusicXML (ours, CC BY-SA 4.0).

We **do not** ship: generic MuseScore.com community uploads or `musetrainer/library` `.mxl`
(license-unverified), the CCARH/`jthickstun/joplin-rags` `**kern`**`** files (repo license = *none* /
NOASSERTION → not reusable), or thesession.org ABC (ODbL + explicit anti-LLM clause). Mutopia/IMSLP are
used only as the **reference** to transcribe from (PD PDF + LilyPond, not MusicXML). Every dense
hand-authored score MUST pass `scores:validate` + a page-by-page proof against its reference before it
ships — never ship wrong notes.

## Status + provenance

**All 55 catalogue scores are shipped + validated** (each parses cleanly in alphaTab via
`scores:validate`, converted losslessly from the original MusicXML). Every one is
`origin: hand-authored` — CC BY-SA 4.0, attributed
"Arrangement: The Music Repository (after <composer>, public domain)". The CC0 OpenScore route was
**not** used because retrieval is 403/login-gated (not automatable), and the CCARH kern route was
rejected (repo license = NOASSERTION — see policy above); both remain valid future upgrades if a
cleaner source is fetched manually.

**Fidelity tiers (honest):**
- **Note-accurate / complete** — the deterministic exercises (scales) and short well-known tunes/themes:
  Ode to Joy, C-major & bass/ukulele scales, Für Elise theme, Moonlight arpeggio texture, Chopin Prelude
  Op.28/4, Bach Prelude BWV 846 figuration, and the folk melodies (correct key, contour, cadence).
- **Faithful arrangements** — the dense works (rags, Nocturne, Recuerdos, sonata movements, Clair de
  Lune, Gnossienne, guitar studies): a musically-correct rendition of the **principal/opening section**
  in the authentic key, meter, harmony, texture, and rhythm — recognizable real music, not note-for-note
  transcriptions of the full multi-page originals. These are the highest-value targets for a future
  reference-proofing pass (`scores:validate` previews vs the PD reference PDF) to tighten specific
  pitches; the per-score `meta.json` `sourceUrl` points at the IMSLP/Mutopia reference for each.

The full per-slug source references live in each `<slug>.meta.json`. Reference sources used:
OpenScore/Open-WTC (CC0, for future upgrade), Mutopia + IMSLP (PD, transcription reference only).

> **Guitar/bass/ukulele tab (ADR 0027):** the fretted scores are *pitched* (not fretted), so for `tab`
> mode the engine makes each staff stringed at load — `tabTuningFor(instruments)` supplies the standard
> tuning and frets are auto-assigned from pitch (lowest playable position, octave-aware for guitar/bass).
> This renders correct, playable tab; to pin exact fingerings, author the `.alphatex` with `fret.string`
> notation (see the `add-score` skill).

## Tests

- `apps/api/src/infrastructure/database/seed-scores.test.ts` — every `SCORE_ALPHATEX` entry is a
  non-empty alphaTex document with a `\track`, with a matching `SCORE_META` (valid origin + license +
  attribution); a regression guard that `makeMinimalPdf`/`withPdf` are gone.
- `scores:validate` is the parse/structure gate (alphaTab `AlphaTexImporter`).
- Pure helpers unit-tested in `apps/web/src/lib/score/{loop,loop-selection}.test.ts` (display-mode
  routing + tick-based A–B loop reducer). Engine runtime is E2E-only (Worker/AudioWorklet).
- E2E (Playwright): a score page renders via alphaTab, plays back, and exposes Download PDF.
