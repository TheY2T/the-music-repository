import { Icon } from '@TheY2T/tmr-ui';
import { Select } from '@TheY2T/tmr-ui/components/ui/select';
import {
  ChordDiagram,
  generateChordShapes,
  type Instrument,
  supportedQualities,
  TUNING_LOW_FIRST,
} from '@TheY2T/tmr-ui/music';
import { useEffect, useState } from 'react';
import LevelToggle from '@/components/LevelToggle';
import { playTone } from '@/lib/audio';
import { tuningFor } from '@/lib/embeds';
import {
  CHORDS,
  chordsByLevel,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
} from '@/lib/music-theory';
import { useLevel } from '@/lib/use-level';

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

const INSTRUMENTS: { key: Instrument; label: string }[] = [
  { key: 'guitar', label: 'Guitar' },
  { key: 'ukulele', label: 'Ukulele' },
  { key: 'bass', label: 'Bass' },
];

// Bass grips are root-position (root · 5th · octave) and quality-neutral, so a short chord-aware list
// is clearer there than the full quality menu.
const BASS_QUALITIES = ['major', 'minor', 'dominant-7'];

function qualityKeysFor(instrument: Instrument): string[] {
  return instrument === 'bass' ? BASS_QUALITIES : supportedQualities(instrument);
}

/** Strum a chord shape low→high on the given tuning (absolute frets). */
function strumShape(frets: number[], tuning: number[]): void {
  let delay = 0;
  frets.forEach((fret, i) => {
    if (fret < 0) return;
    window.setTimeout(() => playTone(midiToFrequency(tuning[i] + fret), 1.1), delay);
    delay += 22;
  });
}

export default function ChordDiagrams() {
  const { level, setLevel } = useLevel();
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [root, setRoot] = useState(0);
  const [quality, setQuality] = useState('major');

  const tuning = tuningFor(instrument);
  // Qualities this instrument can voice, narrowed to the learner's level.
  const levelKeys = new Set(chordsByLevel(level).map((c) => c.key));
  const qualityKeys = qualityKeysFor(instrument).filter((key) => levelKeys.has(key));
  // Keep the selection valid when the instrument or level narrows past it (major is always available).
  useEffect(() => {
    if (!qualityKeys.includes(quality)) setQuality(qualityKeys[0] ?? 'major');
  }, [qualityKeys, quality]);

  const shapes = generateChordShapes(root, quality, instrument);
  const qualityName = CHORDS.find((c) => c.key === quality)?.name ?? quality;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Instrument</span>
          <Select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as Instrument)}
            className="h-auto w-auto px-2 py-1"
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Root</span>
          <Select
            value={root}
            onChange={(e) => setRoot(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {ROOT_CHOICES.map((pc) => (
              <option key={pc} value={pc}>
                {pitchName(pc)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Chord type
          </span>
          <Select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {qualityKeys.map((key) => (
              <option key={key} value={key}>
                {CHORDS.find((c) => c.key === key)?.name ?? key}
              </option>
            ))}
          </Select>
        </label>
        <LevelToggle level={level} onChange={setLevel} />
      </div>

      {shapes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {shapes.map((shape) => (
            <button
              key={shape.family}
              type="button"
              onClick={() => strumShape(shape.frets, tuning)}
              className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
            >
              <span className="font-semibold">
                {shape.name} · {shape.family}
              </span>
              <ChordDiagram chord={shape} />
              <span className="text-xs text-muted-foreground">
                <Icon name="play" className="size-4" />
                Strum
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No shape available for {pitchName(root)} {qualityName} on this instrument.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Movable voicings across the neck (low string on the left). × = don’t play that string, ○ =
        play it open, dots = fretted notes; a “fr” label marks a shape’s starting fret higher up.
        Click a shape to strum it.
      </p>
    </div>
  );
}
