# Feature: Scores (real engraved MusicXML + playback + PDF)

- **Phase:** Catalogue → Scores · **Status:** pipeline + UX shipped; content authoring in progress
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

## Sourcing + status matrix (57 pieces)

`origin`/status per slug. **done** = shipped + validated. **openscore-cc0** = clean CC0 MusicXML exists;
retrieval is manual (MuseScore returns 403 to automation + gates downloads behind login) → drop the
`.mxl` (unzip → `.musicxml`) into `content/scores/`. **hand-author (Tier A–D)** = transcribe from the
listed PD reference through the proof gate; Tier A→D = increasing effort/risk.

| Slug | Origin / status | Reference (transcribe-from) |
|---|---|---|
| beethoven-ode-to-joy | **done** (hand-authored) | — |
| c-major-scale-two-octaves | **done** (hand-authored) | — |
| ukulele-major-scale-shapes | **done** (hand-authored) | — |
| bass-major-scale-fingerings | **done** (hand-authored) | — |
| bach-prelude-c-major-bwv-846 | openscore-cc0 (Open WTC) | musescore.com/opengoldberg |
| beethoven-fur-elise-opening | openscore-cc0 (extract opening) | musescore.com/openscore |
| beethoven-moonlight-sonata-1st-mvt | openscore-cc0 (extract mvt I) | musescore.com/openscore |
| debussy-clair-de-lune | openscore-cc0 | musescore.com/openscore-transcriptions |
| debussy-arabesque-no1 | openscore-cc0 (Deux Arabesques) | musescore.com/openscore |
| schubert-ave-maria | openscore-cc0 (voice+piano → fold to piano) | OpenScore Lieder Corpus |
| joplin-the-entertainer | hand-author D (kern unlicensed) | IMSLP / Mutopia PD |
| joplin-maple-leaf-rag | hand-author D (kern unlicensed) | IMSLP / Mutopia PD |
| joplin-pineapple-rag | hand-author D (kern unlicensed) | IMSLP / Mutopia PD |
| joplin-solace | hand-author D (kern unlicensed) | IMSLP PD |
| joplin-ragtime-dance | hand-author D | IMSLP PD (pick 1906 piano version) |
| lamb-american-beauty-rag | hand-author D | IMSLP (CC-BY typeset ref) |
| scott-frog-legs-rag | hand-author D | IMSLP (CC-BY 4.0 typeset ref) |
| handy-st-louis-blues | hand-author D | IMSLP PD (pick solo-piano treatment) |
| bach-minuet-in-g | hand-author A | Mutopia PD / IMSLP |
| bach-invention-no1-bwv772 | hand-author C | Mutopia (CC BY-SA) / IMSLP PD |
| mozart-minuet-in-f-k2 | hand-author A | IMSLP / Musopen PD |
| mozart-sonata-k545-1st-mvt | hand-author C | Mutopia PD / IMSLP |
| chopin-prelude-e-minor-op28-no4 | hand-author C | IMSLP PD |
| chopin-nocturne-op9-no2 | hand-author D | IMSLP PD |
| chopin-waltz-a-minor-b150 | hand-author C | IMSLP / Musopen PD |
| schumann-the-wild-horseman-op68 | hand-author A | IMSLP (CC-PD-Mark) |
| schumann-melody-op68-no1 | hand-author A | IMSLP (CC-PD-Mark) |
| clementi-sonatina-op36-no1-1st-mvt | hand-author C | Mutopia PD / IMSLP |
| kuhlau-sonatina-op20-no1-1st-mvt | hand-author C | Mutopia PD / IMSLP |
| burgmuller-arabesque-op100-no2 | hand-author C | Mutopia PD / IMSLP |
| burgmuller-la-candeur-op100-no1 | hand-author A | Mutopia PD / IMSLP |
| beethoven-sonatina-in-g-anh5 | hand-author C | IMSLP PD |
| schubert-landler-d366 | hand-author A | IMSLP PD |
| satie-gymnopedie-no1 | hand-author C | Mutopia PD |
| satie-gnossienne-no1 | hand-author D | Mutopia (CC BY-SA) |
| greensleeves-trad | hand-author A | trad. (author melody + chords) |
| scarborough-fair | hand-author B | trad. Dorian melody |
| danny-boy | hand-author B | trad. (Londonderry Air) |
| house-of-the-rising-sun | hand-author B | trad. 6/8 |
| shenandoah | hand-author A | trad. / IMSLP PD |
| wildwood-flower | hand-author B | trad. |
| simple-gifts | hand-author A | trad. (Brackett) |
| swing-low-sweet-chariot | hand-author A | IMSLP PD (Burleigh 1918) |
| when-the-saints-go-marching-in | hand-author A | trad. |
| frankie-and-johnny | hand-author B | trad. 12-bar |
| aloha-oe-ukulele | hand-author B | IMSLP PD (1912 uke-chord ed.) |
| sor-study-op60-no1 | hand-author A | IMSLP PD |
| sor-study-op35-no22 | hand-author C | IMSLP / Mutopia (CC BY-SA) |
| carcassi-guitar-study-op60-no1 | hand-author A | Mutopia PD / IMSLP |
| carcassi-study-op60-no7 | hand-author C | Mutopia PD / IMSLP |
| carulli-guitar-study | hand-author A | Mutopia (CC BY) / IMSLP |
| carulli-andante-op241 | hand-author A | Mutopia (CC BY) |
| tarrega-lagrima | hand-author D | IMSLP PD |
| tarrega-adelita | hand-author D | IMSLP PD |
| tarrega-recuerdos-de-la-alhambra | hand-author D | IMSLP PD |

## Tests

- `apps/api/src/infrastructure/database/seed-scores.test.ts` — every `SCORE_XML` entry is
  `<score-partwise` MusicXML with a matching `SCORE_META` (valid origin + license + attribution); and a
  **regression guard** that `makeMinimalPdf`/`withPdf` are gone (no placeholder PDFs).
- `scores:validate` is the manual fidelity gate (Verovio engrave + preview).
- E2E (Playwright): a score page renders the Verovio SVG, plays back, and exposes Download PDF.
