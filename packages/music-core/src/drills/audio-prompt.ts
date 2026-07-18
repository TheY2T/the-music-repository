/** Play a drill's audio presentation (browser-only) via the sampled note service. */

import { playNote } from '../soundfont';
import type { NoteEvent } from './drill-types';

/** Sound a sequence of note events, each scheduled at its `atMs` offset from now. */
export function playNotes(notes: NoteEvent[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  for (const note of notes) {
    window.setTimeout(
      () => playNote(note.midi, note.durationMs / 1000, { velocity: note.velocity ?? 0.85 }),
      note.atMs,
    );
  }
}
