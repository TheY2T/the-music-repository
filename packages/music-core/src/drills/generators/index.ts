/** The Phase-0 drill deck registry — the four original decks as pure `DrillItemGenerator`s. */

import type { DrillItemGenerator } from '../drill-types';
import { buildIntervalDeck } from './build-interval';
import { cadenceEarDeck } from './cadence-ear';
import { chordQualityDeck } from './chord-quality';
import { fretboardNoteDeck } from './fretboard-note';
import { intervalsDeck } from './intervals';
import { progressionEarDeck } from './progression-ear';
import { rhythmEchoDeck } from './rhythm-echo';
import { scaleDegreesDeck } from './scale-degrees';
import { singIntervalDeck } from './sing-interval';
import { staffNotesDeck } from './staff-notes';

export { buildIntervalDeck } from './build-interval';
export { cadenceEarDeck } from './cadence-ear';
export { chordQualityDeck } from './chord-quality';
export { fretboardNoteDeck } from './fretboard-note';
export { intervalsDeck } from './intervals';
export { progressionEarDeck } from './progression-ear';
export { rhythmEchoDeck } from './rhythm-echo';
export { scaleDegreesDeck } from './scale-degrees';
export { singIntervalDeck } from './sing-interval';
export { staffNotesDeck } from './staff-notes';

/** All generators, keyed by their stable `deck` id. Add new decks here as later phases land. */
export const DRILL_GENERATORS: DrillItemGenerator<string>[] = [
  intervalsDeck,
  chordQualityDeck,
  scaleDegreesDeck,
  staffNotesDeck,
  buildIntervalDeck,
  fretboardNoteDeck,
  progressionEarDeck,
  cadenceEarDeck,
  singIntervalDeck,
  rhythmEchoDeck,
];

export function findGenerator(deck: string): DrillItemGenerator<string> | undefined {
  return DRILL_GENERATORS.find((g) => g.deck === deck);
}
