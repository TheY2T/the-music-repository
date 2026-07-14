# Feature: Scores (real engraved MusicXML + playback + PDF)

- **Phase:** Catalogue → Scores · **Status:** shipped — all 55 catalogue scores populated + validated
- **Related:** `docs/features/catalogue.md` (detail page + media), `docs/features/play-along.md`
  (`/tools/score`), ADR 0024, ADR 0022 (PixiJS play-head).

## Purpose

Give catalogue pieces **real sheet music** instead of the old placeholder PDFs. Every score is a single
**MusicXML** source of truth; from it the web `ScoreViewer` derives (a) an engraving (Verovio → SVG),
(b) **notation-synced Web-Audio playback** (moving highlight + play-head + speed), and (c) a
**downloadable PDF** exported client-side from the same engraving. There is no stored PDF binary.

> **History:** before this feature, 56 items carried `withPdf: true` and were seeded with a synthetic
> one-page placeholder (`makeMinimalPdf`) that printed only the title + "sample score". That helper and
> the `withPdf` flag are **gone**; a piece now shows a score iff it has a `musicxml` media asset.

## Authoring pipeline (file-based)

Scores are authored like catalogue content + collections — files on disk, bundled to a committed
`seed-*.ts` (the seed runs from `dist/`, so loose files can't be read at runtime).

```
apps/api/src/infrastructure/database/content/scores/
  <slug>.musicxml     # MusicXML 3.1 partwise — the single source of truth
  <slug>.meta.json    # provenance/licensing (ScoreMeta), recorded on the media asset
```

`<slug>` must match a `content_items` slug. `<slug>.meta.json`:

```json
{
  "origin": "openscore | kern | hand-authored",
  "source": "OpenScore",
  "sourceUrl": "https://…",
  "license": "CC0 | CC BY-SA 4.0 | Public Domain | …",
  "attribution": "OpenScore (musescore.com/openscore)"
}
```

- `pnpm --filter @TheY2T/tmr-api scores:build` → bundles the pair for every slug into the committed
  `seed-scores.ts` (`SCORE_XML: Record<slug,string>` + `SCORE_META: Record<slug, ScoreMeta>`).
- `pnpm --filter @TheY2T/tmr-api scores:validate` → **fidelity gate**: loads each MusicXML into Verovio,
  asserts it parses + engraves, and writes a preview SVG per score to `apps/api/.score-previews/`
  (git-ignored) for **page-by-page proofing against the public-domain reference**. Requires the
  `verovio` devDependency (cataloged).

The seed (`seed.ts`) uploads each `SCORE_XML` entry as a `musicxml` media asset and records the
`SCORE_META` **engraving** license/attribution/`source_url` on the asset (not the piece's own
attribution). `media_assets.source_url` (migration `drizzle/0019_*`) stores the provenance URL.

## Frontend (`ScoreViewer.tsx`)

- Engraves the MusicXML with Verovio; **Play** schedules Web-Audio tones from the Verovio timemap and
  animates the sounding notes + a PixiJS play-head glow (ADR 0022); a 0.5×–1.5× speed slider.
- **Download PDF** re-lays the score into portrait pages via the loaded toolkit and opens a print
  window (browser "Save as PDF") — same source, always matches the screen, no stored binary.
- An **engraving-credit line** (`score.creditLabel`) shows source + license (from the `MediaAsset`
  `attribution`/`license`/`sourceUrl` contract fields), so provenance is visible + auditable.

`ContentDetail.tsx` prefers the `musicxml` branch; the legacy PDF `<iframe>` branch remains only as a
fallback for CMS-uploaded PDFs (no seeded placeholders reach it anymore).

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

**All 55 catalogue scores are shipped + validated** (each engraves cleanly in Verovio via
`scores:validate`). Every one is `origin: hand-authored` — CC BY-SA 4.0, attributed
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

## Tests

- `apps/api/src/infrastructure/database/seed-scores.test.ts` — every `SCORE_XML` entry is
  `<score-partwise` MusicXML with a matching `SCORE_META` (valid origin + license + attribution); and a
  **regression guard** that `makeMinimalPdf`/`withPdf` are gone (no placeholder PDFs).
- `scores:validate` is the manual fidelity gate (Verovio engrave + preview).
- E2E (Playwright): a score page renders the Verovio SVG, plays back, and exposes Download PDF.
