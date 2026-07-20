# Instrument samples (FluidR3_GM)

Self-hosted General-MIDI instrument samples for the note service
(`packages/music-core/src/soundfont.ts` → smplr `Soundfont`). One
`<instrument>-mp3.js` file per instrument (base64 audio embedded, midi-js-soundfonts
format). The app serves these from its own origin at
`/soundfont/instruments/<instrument>-mp3.js`, so playback needs no third-party host.

- **Soundfont:** FluidR3_GM (CC BY 3.0). See `LICENSE`.
- **Instruments:** the set is driven by `SOUNDFONT_INSTRUMENTS` in `soundfont.ts`.
- **Populate / refresh:** `pnpm soundfont:fetch` (add `--force` to re-download).
  The script downloads the FluidR3_GM `mp3` file for each instrument from the
  midi-js-soundfonts project.

The committed files are the source of truth; the fetch script only adds missing
instruments or refreshes the set on demand.
