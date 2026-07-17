// @TheY2T/tmr-musickit-ui/organisms — shared music-rendering primitives (domain organisms).
// The presentational SVG components (ChordDiagram, StaffSequence) live here; the chord-shape DATA
// and staff geometry live in `@TheY2T/tmr-music-core` and are re-exported here for a single import
// surface. Audio/theory LOGIC stays in music-core / the app and is injected via props at the call site.

export {
  BASS_TUNING_LOW_FIRST,
  CAGED_FAMILIES,
  type GenerateOptions,
  generateCagedShapes,
  generateChordShapes,
  type Instrument,
  supportedQualities,
} from '@TheY2T/tmr-music-core/chord-library';
export {
  type ChordShape,
  GUITAR_CHORDS,
  TUNING_LOW_FIRST,
  UKULELE_CHORDS,
  UKULELE_TUNING_LOW_FIRST,
} from '@TheY2T/tmr-music-core/chord-shapes';
export { ledgerSteps } from '@TheY2T/tmr-music-core/staff-geometry';
export { ChordDiagram } from './chord-diagram';
export { type StaffNoteDatum, StaffSequence, type StaffSequenceProps } from './StaffSequence';
