/**
 * Pure decision helpers for the score player (ADR 0027). No DOM/audio/engine deps → unit-tested.
 * alphaTab owns tempo maps, metronome, count-in, and loop scheduling natively, so all the Verovio-era
 * tick/measure math is gone — the only decision left here is which display mode a score renders in.
 */
import type { ScoreDisplayMode } from './score-engine';

/** Fretted instruments that get alphaTab's default score+tab guitar UI. */
const FRETTED = new Set(['guitar', 'bass', 'ukulele']);

/**
 * Open-string MIDI pitches (string 1 = highest, alphaTab's ordering) for the fretted instruments, so a
 * pitched score can be rendered as tablature. Standard tunings: guitar EADGBE, bass EADG, ukulele gCEA.
 */
const TAB_TUNINGS: Record<string, number[]> = {
  guitar: [64, 59, 55, 50, 45, 40], // E4 B3 G3 D3 A2 E2
  bass: [43, 38, 33, 28], // G2 D2 A1 E1
  ukulele: [69, 64, 60, 67], // A4 E4 C4 g4 (reentrant high-G)
};

/**
 * The tab tuning to render a score with, chosen from its instruments (first fretted one wins), or null
 * for non-fretted scores. The engine uses this to make a pitched staff stringed + assign frets.
 */
export function tabTuningFor(instruments: string[]): number[] | null {
  for (const inst of instruments) {
    if (TAB_TUNINGS[inst]) return TAB_TUNINGS[inst];
  }
  return null;
}

/**
 * How a score should render. An explicit `override` (from the score's meta) always wins. Otherwise a
 * piano-based score (piano present, incl. piano+guitar) → `standard` notation with the purpose-built
 * piano transport; a fretted-only score → `tab` (alphaTab's default guitar UI); anything else →
 * `standard`.
 */
export function resolveDisplayMode(
  instruments: string[],
  override?: ScoreDisplayMode | null,
): ScoreDisplayMode {
  if (override) return override;
  if (instruments.includes('piano')) return 'standard';
  if (instruments.some((i) => FRETTED.has(i))) return 'tab';
  return 'standard';
}
