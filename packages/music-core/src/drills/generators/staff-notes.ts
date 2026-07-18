/** Note-reading deck: read a note on the treble staff, name it (multiple-choice). */

import { trebleStaffNotes } from '../../music-theory';
import type { DrillItemGenerator, DrillOption } from '../drill-types';
import { exactMatch, sampleOptions } from './shared';

const STAFF_NOTES = trebleStaffNotes();
const POOL: DrillOption[] = STAFF_NOTES.map((note) => ({ value: note.name, label: note.name }));

export const staffNotesDeck: DrillItemGenerator<string> = {
  deck: 'staff-notes',
  modality: 'multiple-choice',
  cards: STAFF_NOTES.map((note) => note.name),
  generate(card, _level, rng) {
    const note = STAFF_NOTES.find((n) => n.name === card) ?? STAFF_NOTES[0];
    const correct: DrillOption = { value: note.name, label: note.name };
    return {
      card,
      modality: 'multiple-choice',
      level: 'beginner',
      presentation: { kind: 'staff', clef: 'treble', step: note.step },
      expected: note.name,
      options: sampleOptions(correct, POOL, 4, rng),
      answerLabel: note.name,
    };
  },
  check: exactMatch,
};
