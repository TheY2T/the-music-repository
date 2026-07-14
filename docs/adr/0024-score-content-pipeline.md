# ADR 0024 — Score content pipeline (MusicXML single-source, client-side PDF, licensing)

- **Status:** accepted
- **Date:** 2026-07-14
- Supersedes the placeholder-PDF seed path (`makeMinimalPdf` + `withPdf`), now removed.

## Context

56 catalogue items advertised sheet music (`withPdf: true`) but were seeded with a synthetic one-page
placeholder PDF; only 2 pieces had real (inline) MusicXML. The web `ScoreViewer` already engraved
MusicXML with Verovio and played it back (timemap → Web Audio + PixiJS play-head), so the gap was
**content**, not capability. Goal: real, complete, license-clean scores for every piece, engraved +
playable + downloadable.

## Decisions

1. **MusicXML is the single source of truth per score.** From it we derive the engraving + playback
   (runtime, `ScoreViewer`) and the downloadable PDF. No second binary is stored. This removes
   `makeMinimalPdf`, the `withPdf` flag, and the seeded `score_pdf` placeholder assets entirely — a
   piece shows a score iff it has a `musicxml` media asset.

2. **File-based authoring** (`content/scores/<slug>.musicxml` + `<slug>.meta.json` → `scores:build` →
   committed `seed-scores.ts`), mirroring the catalogue/collections pipelines (the seed runs from
   `dist/`, so data is bundled, not read loose). Replaces the hand-inlined `SCORE_XML` map.

3. **Client-side PDF export**, not a stored/generated PDF. `ScoreViewer` re-lays the loaded score into
   portrait pages and prints (browser "Save as PDF"). Rationale: single source, always matches the
   screen, zero binary storage, no seed/CI renderer. (Alternative considered: build-time Verovio +
   headless-Chromium `scores:pdf` committing `<slug>.pdf` — rejected as heavier binary bundling for no
   fidelity gain.)

4. **Per-asset engraving provenance.** New `media_assets.source_url` (migration `drizzle/0019_*`) +
   `MediaAsset.sourceUrl` in the contract. The seed records the **engraving's** license/attribution/
   source (from `ScoreMeta`), distinct from the piece's own attribution, and the UI shows an
   engraving-credit line.

5. **Licensing policy — ship only clean engravings.** CC0 (OpenScore / Open Well-Tempered Clavier) or
   hand-authored-by-us (CC BY-SA 4.0). Explicitly rejected: generic MuseScore.com uploads and
   `musetrainer/library` `.mxl` (license-unverified); CCARH `jthickstun/joplin-rags` `**kern` (repo
   license = NOASSERTION/none → not reusable, demoted to hand-author per the risk plan); thesession.org
   ABC (ODbL + anti-LLM clause). Mutopia/IMSLP PD editions are the transcription **reference** only.

6. **Fidelity gate.** `scores:validate` (Verovio) asserts every score engraves and emits a preview SVG;
   dense hand-authored scores must be proofed page-by-page against their PD reference before shipping.
   Never ship wrong notes.

## Consequences

- Retrieval of the CC0 sources is **manual** (MuseScore 403s automation + gates downloads) — the
  clean-source ingest is a drop-in step, not automatable in CI.
- Full accurate transcription of the dense tier (Chopin Nocturne, Recuerdos, the rags, …) is
  substantial, proof-gated work; the sourcing matrix in `docs/features/scores.md` tracks per-piece
  status so it is turnkey to complete.
- `verovio` is now a cataloged dependency used by both `apps/web` (runtime) and `apps/api` (validation).
