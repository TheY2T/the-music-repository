# Licensing compliance — third-party software & assets

How The Music Repository satisfies the licenses of the open-source software, fonts, sounds, and content
it ships, and what must be included when deploying to the web. The project is a **closed-source, hosted
web application** that also serves **client-side JavaScript bundles and font files to browsers** — so it
both *uses* and *redistributes* third-party code, which is what triggers attribution obligations.

## Bottom line

The dependency tree is almost entirely permissive (MIT / Apache-2.0 / ISC / BSD). Using permissive
packages in a closed-source product is fine: the only obligation is to preserve each package's copyright
notice and license text and to keep the warranty disclaimer intact — there is **no copyleft effect** and
no requirement to open our own source. There is **no GPL/AGPL and no missing-license package** anywhere
in the resolved tree.

Four things need deliberate handling; all are addressed by the files below.

## What ships at deploy time (Definition of Done for compliance)

Present at the repository root and in the deployed artifact:

- **`THIRD-PARTY-LICENSES.md`** — every production dependency (name, version, author, homepage, SPDX id)
  with its verbatim license text. Generated from the installed tree by `pnpm licenses:generate`
  (`scripts/generate-third-party-licenses.mjs`). Regenerate whenever dependencies change.
- **`NOTICE`** — human-readable attribution highlights for the items whose licenses ask for specific
  attribution or carry extra conditions (fonts, alphaTab, SONiVOX soundfont, chords-db, libvips).
- **`LICENSE`** — the proprietary license for our own code (all rights reserved; access ≠ license).
- Make `THIRD-PARTY-LICENSES.md` reachable from the running site (e.g. a `/licenses` route or a footer
  link) or the EULA, since client-side assets are redistributed to end users.

## License inventory (production dependencies)

| License | Packages | Class | Notes |
| --- | --- | --- | --- |
| MIT | ~678 | permissive | keep notice + text |
| Apache-2.0 | ~142 | permissive | keep notice + NOTICE; mark modified files if you modify one |
| ISC | ~43 | permissive | keep notice + text |
| BSD-3-Clause | ~21 | permissive | keep notice; no endorsement clause |
| BSD-2-Clause | ~20 | permissive | keep notice + text |
| BlueOak-1.0.0 | ~8 | permissive | keep notice |
| OFL-1.1 | 7 | permissive (fonts) | keep notice; Reserved Font Name rules — see below |
| MPL-2.0 | 3 | weak copyleft | file-level; fine as unmodified dep — see below |
| LGPL-3.0-or-later | 1 | copyleft (native lib) | dynamically linked prebuilt binary — see below |
| MIT-0 / 0BSD / Unlicense / CC0-1.0 / Python-2.0 / CC-BY-4.0 | 1–2 each | permissive / public-domain | no meaningful obligation |

Counts are per the installed tree and shift as dependencies change; `THIRD-PARTY-LICENSES.md` is the
authoritative, regenerated list.

## Items needing deliberate handling

### 1. alphaTab — MPL-2.0 (ships to the browser)

`@coderline/alphatab` is the notation/playback engine and is lazy-loaded into client islands. MPL-2.0 is
**file-level weak copyleft**: bundling and using it unmodified is fine and imposes nothing on our
proprietary code. The one condition: if we **modify alphaTab's own source files** and distribute the
result, those file-level changes must be offered under MPL-2.0. We consume it as an unmodified dependency,
so the obligation is met by retaining its notice (in `NOTICE` + `THIRD-PARTY-LICENSES.md`). The same
applies to the build-only `lightningcss` (MPL-2.0, not shipped) and the dev/test-only `axe-core`.

### 2. Fonts — SIL Open Font License 1.1 (ship to the browser)

Seven self-hosted `@fontsource` families (Fraunces, Playfair Display, Newsreader, Source Sans 3, Inter,
Libre Baskerville, IBM Plex Mono). OFL explicitly permits web embedding/self-hosting. Conditions: carry
each font's copyright + OFL notice with the fonts (done in `NOTICE`), don't sell the fonts on their own,
and don't apply a **Reserved Font Name** to a modified font. We serve them unmodified, so RFN is not
triggered.

### 3. libvips via sharp — LGPL-3.0-or-later (build/server only)

`sharp` (Apache-2.0) dynamically links the prebuilt `@img/sharp-libvips-*` native binary
(LGPL-3.0-or-later), pulled in by Astro image optimization / `astro-icon`. This is the only copyleft
component. LGPL is satisfied by dynamic linking of an unmodified prebuilt binary — low risk. Do not
statically embed or modify libvips. It is not shipped to browsers. Platform-specific variants
(`-linux-*`) are pulled on the deploy image.

### 4. Instrument samples — self-hosted (FluidR3_GM, CC BY 3.0)

The interactive tools' note service (`packages/music-core/src/soundfont.ts`) plays samples through
`smplr`'s `Soundfont` with an explicit `instrumentUrl` pointing at
`/soundfont/instruments/<instrument>-mp3.js`, served from the app's own origin. The samples are the
FluidR3_GM soundfont ((c) Frank Wen, CC BY 3.0), committed under
`apps/web/public/soundfont/instruments/` with a `LICENSE`; populate/refresh them with
`pnpm soundfont:fetch`. This is distinct from the score player, which uses the self-hosted, Apache-2.0
**SONiVOX** soundfont in `apps/web/public/soundfont/`.

Serving both sample sets from our own origin removes the earlier runtime dependency on a third-party
host — no external `connect-src` is needed and playback works under a strict Content-Security-Policy.
CC BY 3.0 requires attribution, satisfied by the `LICENSE` file and the `NOTICE` entry.

## Music scores & catalogue content

Handled separately from software licensing, and already in good shape:

- **Scores** (`apps/api/src/infrastructure/database/content/scores/*.meta.json`) each record `origin`,
  `source`, `sourceUrl`, `license`, and `attribution`. They ship only original hand-authored engravings
  (CC BY-SA 4.0) or public-domain material. Policy: `docs/features/scores.md`, ADR 0024,
  `.claude/rules/scores.md`.
- **Catalogue / media content** must record `license` + `attribution` per item; sourcing policy in
  `docs/content/licensing.md`.
- **Chord data** is derived from MIT `@tombatossals/chords-db`, attributed in
  `packages/music-core/THIRD_PARTY_NOTICES.md`.

Because we publish scores under **CC BY-SA 4.0**, downstream reuse and share-alike are intentional and
consistent with the site's openly-licensed-content mission — this is our licensing choice for our own
arrangements, not an obligation imposed on us.

## Our own code license

The site is closed-source. The root `package.json` declares `"license": "LicenseRef-Proprietary"` and the
root `LICENSE` file states all-rights-reserved terms; access to the source grants no license. Hosted use
is governed by the site's published Terms of Service (author separately if not yet written).

## Maintaining this

- Run `pnpm licenses:generate` after any dependency change (add to release/CI checks) so
  `THIRD-PARTY-LICENSES.md` never drifts.
- `pnpm licenses:check` prints the current production license breakdown for a quick scan.
- If a future dependency introduces **GPL/AGPL**, or an `UNLICENSED`/missing-license package, treat it as
  a blocker for a closed-source deploy and review before merging. Safe default policy: permissive only
  (MIT / BSD / Apache-2.0 / ISC / OFL for fonts), plus MPL/LGPL only as unmodified dependencies.
