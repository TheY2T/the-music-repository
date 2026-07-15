/**
 * Pure helpers for catalogue content embeds (ADR: interactive-tool embeds). An embed is authored in a
 * content article's ```embeds block (see build-seed-content.mjs) and rendered by `ContentEmbeds`
 * below the prose. These helpers resolve the musical config on an embed (note names, chord symbols,
 * tunings) to the data the tool islands need — kept pure + framework-free so they're unit-testable.
 */
import {
  type ChordShape,
  GUITAR_CHORDS,
  TUNING_LOW_FIRST,
  UKULELE_CHORDS,
  UKULELE_TUNING_LOW_FIRST,
} from '@TheY2T/tmr-ui/music';

/** Note name → pitch class (0–11). Accepts sharps or flats (`C#`/`Db`). Null for an unknown name. */
const NOTE_PC: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

/** Parse a scale-root note name (e.g. `A`, `C#`, `Bb`) to a pitch class 0–11, or null if unknown.
 * Normalises the leading letter to uppercase; the accidental (`#`/`b`) is kept as written. */
export function noteNameToPitchClass(name: string | undefined | null): number | null {
  if (!name) return null;
  const t = name.trim();
  if (!t) return null;
  const norm = t.charAt(0).toUpperCase() + t.slice(1);
  return norm in NOTE_PC ? NOTE_PC[norm] : null;
}

/** The chord-shape library for an instrument (`ukulele` → uke shapes; anything else → guitar). */
export function chordLibraryFor(instrument: string | undefined): ChordShape[] {
  return instrument === 'ukulele' ? UKULELE_CHORDS : GUITAR_CHORDS;
}

/** Open-string MIDI (low-string-first) for an instrument, used to sound a strummed chord shape. */
export function tuningFor(instrument: string | undefined): number[] {
  return instrument === 'ukulele' ? UKULELE_TUNING_LOW_FIRST : TUNING_LOW_FIRST;
}

/** Resolve a chord symbol (e.g. `Am`, `A7`) to its shape for the instrument, or null if unknown. */
export function findChordShape(symbol: string, instrument: string | undefined): ChordShape | null {
  return chordLibraryFor(instrument).find((c) => c.name === symbol) ?? null;
}

/** Chord-quality suffix → semitone intervals from the root. Order matters: longer keys first. */
const QUALITY_INTERVALS: [string, number[]][] = [
  ['maj7', [0, 4, 7, 11]],
  ['M7', [0, 4, 7, 11]],
  ['Δ7', [0, 4, 7, 11]],
  ['Δ', [0, 4, 7, 11]],
  ['m7b5', [0, 3, 6, 10]],
  ['ø7', [0, 3, 6, 10]],
  ['ø', [0, 3, 6, 10]],
  ['dim7', [0, 3, 6, 9]],
  ['°7', [0, 3, 6, 9]],
  ['m7', [0, 3, 7, 10]],
  ['min7', [0, 3, 7, 10]],
  ['maj', [0, 4, 7]],
  ['sus2', [0, 2, 7]],
  ['sus4', [0, 5, 7]],
  ['dim', [0, 3, 6]],
  ['°', [0, 3, 6]],
  ['aug', [0, 4, 8]],
  ['+', [0, 4, 8]],
  ['m6', [0, 3, 7, 9]],
  ['6', [0, 4, 7, 9]],
  ['m', [0, 3, 7]],
  ['min', [0, 3, 7]],
  ['7', [0, 4, 7, 10]],
  ['', [0, 4, 7]],
];

/** Parse a chord symbol (`C`, `Dm`, `G7`, `Cmaj7`, `Bdim`, `Am7b5`) → root pitch class + intervals. */
export function parseChordSymbol(symbol: string): { root: number; intervals: number[] } | null {
  const m = symbol.trim().match(/^([A-Ga-g][#b]?)(.*)$/);
  if (!m) return null;
  const root = noteNameToPitchClass(m[1]);
  if (root == null) return null;
  const suffix = m[2].trim();
  const entry = QUALITY_INTERVALS.find(([q]) => q === suffix);
  return entry ? { root, intervals: entry[1] } : null;
}

/** MIDI notes for a chord symbol, voiced from the given octave (default 4 → C4=60). Null if unknown. */
export function chordToMidi(symbol: string, octave = 4): number[] | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  const rootMidi = 12 * (octave + 1) + parsed.root;
  return parsed.intervals.map((i) => rootMidi + i);
}
