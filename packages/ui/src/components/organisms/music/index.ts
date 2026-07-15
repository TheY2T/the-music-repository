// @TheY2T/tmr-ui/music — shared music-rendering primitives (domain organisms).
// These are the music-domain components reused across many tool islands. Audio/theory LOGIC
// stays in apps/web (src/lib/audio.ts, music-theory.ts); these primitives are presentational —
// they take note/chord data via props and delegate any sound to the call site.

export {
  ChordDiagram,
  type ChordShape,
  GUITAR_CHORDS,
  TUNING_LOW_FIRST,
  UKULELE_CHORDS,
  UKULELE_TUNING_LOW_FIRST,
} from './chord-diagram';
export { type StaffNoteDatum, StaffSequence, type StaffSequenceProps } from './StaffSequence';
export { ledgerSteps } from './staff-geometry';
