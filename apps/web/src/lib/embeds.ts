/**
 * Pure helpers for catalogue content embeds (ADR: interactive-tool embeds). An embed is authored in a
 * content article's ```embeds block (see build-seed-content.mjs) and rendered by `ContentEmbeds`
 * below the prose. These helpers resolve the musical config on an embed (note names, chord symbols,
 * tunings) to the data the tool islands need — kept pure + framework-free so they're unit-testable.
 */
import {
  BASS_TUNING_LOW_FIRST,
  type ChordShape,
  generateChordShapes,
  GUITAR_CHORDS,
  type Instrument,
  TUNING_LOW_FIRST,
  UKULELE_CHORDS,
  UKULELE_TUNING_LOW_FIRST,
} from '@TheY2T/tmr-ui/music';
import { type ChordDefinition, CHORDS } from './music-theory';

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
  if (instrument === 'ukulele') return UKULELE_TUNING_LOW_FIRST;
  if (instrument === 'bass') return BASS_TUNING_LOW_FIRST;
  return TUNING_LOW_FIRST;
}

/** Map an embed's free-text instrument to the generator's instrument set (default guitar). */
function instrumentKey(instrument: string | undefined): Instrument {
  if (instrument === 'ukulele') return 'ukulele';
  if (instrument === 'bass') return 'bass';
  return 'guitar';
}

/**
 * Resolve a chord symbol to a playable shape. Prefers a curated open-position shape (the familiar
 * beginner grips), then falls back to the generative movable-shape library so any root/quality the
 * `CHORDS` table knows — `F♯m7`, `Bbmaj7`, `Ddim` in any key — still renders instead of degrading to a
 * bare text label. Null only when both the symbol and its quality are unknown.
 */
export function findChordShape(symbol: string, instrument: string | undefined): ChordShape | null {
  // Bass has no curated open shapes; go straight to the generated root grips.
  if (instrument !== 'bass') {
    const curated = chordLibraryFor(instrument).find((c) => c.name === symbol);
    if (curated) return curated;
  }
  const parsed = parseChordFull(symbol);
  if (!parsed) return null;
  const [shape] = generateChordShapes(parsed.root, parsed.key, instrumentKey(instrument), {
    name: symbol,
  });
  return shape ?? null;
}

/**
 * Chord-quality suffix → chord definition, derived from the single `CHORDS` source of truth (each chord
 * contributes its canonical `symbol` + any `aliases`). The first definition wins for a given suffix
 * (symbols/aliases are unique across `CHORDS`), so this is an exact-match lookup.
 */
const QUALITY_BY_SUFFIX: Map<string, ChordDefinition> = new Map();
for (const chord of CHORDS) {
  for (const suffix of [chord.symbol, ...(chord.aliases ?? [])]) {
    if (!QUALITY_BY_SUFFIX.has(suffix)) QUALITY_BY_SUFFIX.set(suffix, chord);
  }
}

/** Parse a chord symbol → root pitch class + quality key (a `CHORDS` key) + intervals, or null. */
export function parseChordFull(
  symbol: string,
): { root: number; key: string; intervals: number[] } | null {
  const m = symbol.trim().match(/^([A-Ga-g][#b]?)(.*)$/);
  if (!m) return null;
  const root = noteNameToPitchClass(m[1]);
  if (root == null) return null;
  const chord = QUALITY_BY_SUFFIX.get(m[2].trim());
  return chord ? { root, key: chord.key, intervals: chord.intervals } : null;
}

/** Parse a chord symbol (`C`, `Dm`, `G7`, `Cmaj7`, `Bdim`, `Am7b5`) → root pitch class + intervals. */
export function parseChordSymbol(symbol: string): { root: number; intervals: number[] } | null {
  const parsed = parseChordFull(symbol);
  return parsed ? { root: parsed.root, intervals: parsed.intervals } : null;
}

/** MIDI notes for a chord symbol, voiced from the given octave (default 4 → C4=60). Null if unknown. */
export function chordToMidi(symbol: string, octave = 4): number[] | null {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  const rootMidi = 12 * (octave + 1) + parsed.root;
  return parsed.intervals.map((i) => rootMidi + i);
}
