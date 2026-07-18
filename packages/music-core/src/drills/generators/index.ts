/** The Phase-0 drill deck registry — the four original decks as pure `DrillItemGenerator`s. */

import type { DrillItemGenerator } from '../drill-types';
import { chordQualityDeck } from './chord-quality';
import { intervalsDeck } from './intervals';
import { scaleDegreesDeck } from './scale-degrees';
import { staffNotesDeck } from './staff-notes';

export { chordQualityDeck } from './chord-quality';
export { intervalsDeck } from './intervals';
export { scaleDegreesDeck } from './scale-degrees';
export { staffNotesDeck } from './staff-notes';

/** All generators, keyed by their stable `deck` id. Add new decks here as later phases land. */
export const DRILL_GENERATORS: DrillItemGenerator<string>[] = [
  intervalsDeck,
  chordQualityDeck,
  scaleDegreesDeck,
  staffNotesDeck,
];

export function findGenerator(deck: string): DrillItemGenerator<string> | undefined {
  return DRILL_GENERATORS.find((g) => g.deck === deck);
}
