import { Icon } from '@TheY2T/tmr-ui';
import { Select } from '@TheY2T/tmr-ui/components/ui/select';
import { ChordDiagram, GUITAR_CHORDS, TUNING_LOW_FIRST } from '@TheY2T/tmr-ui/music';
import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

// Chord-diagram DATA + rendering now live in @TheY2T/tmr-ui/music. Re-exported here so the ~6
// tools importing from `@/components/ChordDiagrams` keep working. Audio (`strumChord`) stays in
// the app because sound generation is an app concern.
export {
  ChordDiagram,
  type ChordShape,
  GUITAR_CHORDS,
  TUNING_LOW_FIRST,
} from '@TheY2T/tmr-ui/music';

/** Strum a chord: sound each non-muted string in sequence, low→high (down) or high→low (up). */
export function strumChord(
  frets: number[],
  direction: 'down' | 'up' = 'down',
  duration = 1.1,
): void {
  const order = frets.map((_, i) => i);
  if (direction === 'up') {
    order.reverse();
  }
  let delay = 0;
  for (const i of order) {
    if (frets[i] < 0) {
      continue;
    }
    window.setTimeout(
      () => playTone(midiToFrequency(TUNING_LOW_FIRST[i] + frets[i]), duration),
      delay,
    );
    delay += 22;
  }
}

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'major', label: 'Major' },
  { key: 'minor', label: 'Minor' },
  { key: 'barre', label: 'Barre' },
];

export default function ChordDiagrams() {
  const [category, setCategory] = useState('all');
  const chords = GUITAR_CHORDS.filter((c) => category === 'all' || c.quality === category);

  return (
    <div className="space-y-5">
      <label className="space-y-1 text-sm">
        <span className="block font-medium" data-help="chords">
          Category
        </span>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-auto w-auto px-2 py-1"
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {chords.map((chord) => (
          <button
            key={chord.name}
            type="button"
            onClick={() => strumChord(chord.frets)}
            className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
          >
            <span className="font-semibold">{chord.name}</span>
            <ChordDiagram chord={chord} />
            <span className="text-xs text-muted-foreground">
              <Icon name="play" className="size-4" />
              Strum
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Standard open and barre shapes (low E on the left). × = don’t play that string, ○ = play it
        open, dots = fretted notes. Click a chord to strum it.
      </p>
    </div>
  );
}
