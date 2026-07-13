# Catalogue content — editorial review checklist

The 83 catalogue items were enriched with researched bodies + structured `details` (see
`docs/features/catalogue.md`). The research verified facts against the web where possible and **hedged
genuinely uncertain points in the prose rather than asserting them**. This document lists everything a
human editor should sanity-check before treating the content as authoritative. Nothing below is stated
as fact in the content that isn't — these are "confirm / tighten" items, not known errors.

Content source of truth: `apps/api/src/infrastructure/database/content/<slug>.md`. After edits:
`pnpm --filter @TheY2T/tmr-api content:build` → rebuild api → reseed.

## Attribution / authorship

| Slug | Note | Suggested action |
|---|---|---|
| `beethoven-sonatina-in-g-anh5` | Authorship is **doubtful/spurious** (Anh. 5). Body explains this honestly; `composedYear` left empty. | Confirm the "attrib. Beethoven" framing is acceptable; consider labelling "attributed". |
| `amazing-grace-trad` | Words = John Newton (1772); the familiar **tune "New Britain"** is a separate American folk melody paired with the text later — pairing date given as *c. 1830s* but sources vary (≈1835 publication vs "~60 years later"). | Confirm the pairing wording; pick a citation if you want a firm date. |

## Origins genuinely uncertain (flagged in the prose)

| Slug | Note |
|---|---|
| `shenandoah` | Exact origin/meaning is unknowable (river traders / voyageurs → sea shanty). Body says so rather than inventing a story. |
| `danny-boy` | Melody = "Londonderry Air" (collected by Jane Ross, pub. 1855); lyrics Weatherly 1910, set to the air 1913 — verified, but the air's own origin is debated. |

## Musical keys / time signatures to confirm against a chosen edition

Keys and time signatures reflect **common performing conventions for beginner–intermediate
arrangements**, not a single canonical urtext — they can vary by edition/arrangement/singer. The
`details.key` / `details.timeSignature` fields should be read as *typical*, not definitive. Spot-check
these in particular:

| Slug | Note |
|---|---|
| `scott-frog-legs-rag` | Key given as D-flat major from established knowledge; **not** re-confirmed against a primary score. |
| `joplin-the-entertainer`, `joplin-maple-leaf-rag`, `satie-gymnopedie-no1`, `satie-gnossienne-no1` | Keys (C / A-flat / D / F minor) from standard editions; consistent but not each re-confirmed per primary score. |
| `beethoven-ode-to-joy`, `schubert-ave-maria` | These are **arrangements**; the stored key reflects the arrangement (the original theme/song key differs — noted in the body). Confirm which key your rendered arrangement is actually in. |
| `chopin-waltz-a-minor-b150` | Composition **year** is genuinely unsettled in the sources; body says only "late Chopin, published posthumously" (no year asserted). |
| `schubert-landler-d366` | D. 366 is a set of **17 Ländler**; sources don't cleanly isolate which is the "B-flat" one. Body honours the seed key but frames it as "one of the 17". |
| `carulli-andante-op241` | Op. 241 contains many short Andantes in various keys; the specific *number* within the opus is unconfirmed — written as a representative C-major Andante. |
| `carulli-guitar-study` | Generic "Guitar Study in A minor" with no opus number in the seed; described as a representative Carulli A-minor arpeggio study (specific opus/year unconfirmed). |
| `sor-study-op60-no1` and various classical-guitar/piano section keys | Section keys + some time signatures rely on repertoire knowledge + the seed metadata rather than a note-level source. |

## Not flagged (high confidence)

- All **music-theory + technique lessons** (`omt-*`, blues/pentatonic, ukulele/bass fundamentals) —
  standard theory/technique; fingerings (piano scales, chromatic, bass box, ukulele shapes) were
  verified note-by-note.
- Composer dates and catalogue numbers that were web-verified: Bach BWV, Debussy L./catalogue,
  Satie dates, Joplin/Scott/Lamb rag years, Handy *St. Louis Blues* (1914), Tárrega *Recuerdos*
  (tremolo study), Simple Gifts (Joseph Brackett, 1848), Aloha ʻOe (Queen Liliʻuokalani).
