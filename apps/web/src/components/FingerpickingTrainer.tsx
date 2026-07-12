import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { ChordDiagram, GUITAR_CHORDS, TUNING_LOW_FIRST } from '@/components/ChordDiagrams';
import { playTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

// Low-E first.
const STRING_LETTERS = ['E', 'A', 'D', 'G', 'B', 'e'];

// A slot is a string to pluck: 'B' = bass (lowest fretted), 'A' = alternate bass, '3'–'5' = a
// treble string by index, '-' = rest.
type Slot = 'B' | 'A' | '3' | '4' | '5' | '-';

interface Pattern {
  key: string;
  label: string;
  slots: Slot[];
}

const PATTERNS: Pattern[] = [
  {
    key: 'travis',
    label: 'Travis (alternating bass)',
    slots: ['B', '5', 'A', '4', 'B', '5', 'A', '4'],
  },
  { key: 'ascend', label: 'Bass + ascend', slots: ['B', '3', '4', '5', 'A', '3', '4', '5'] },
  { key: 'ballad', label: 'Ballad', slots: ['B', '5', '4', '5', 'A', '5', '4', '5'] },
];

/** The played (non-muted) string indices, low to high. */
function playedStrings(frets: number[]): number[] {
  return frets.map((f, i) => (f >= 0 ? i : -1)).filter((i) => i >= 0);
}

/** Resolve a pattern slot to a concrete string index for this chord, or null to skip. */
function resolveSlot(slot: Slot, frets: number[]): number | null {
  if (slot === '-') {
    return null;
  }
  const played = playedStrings(frets);
  if (slot === 'B') {
    return played[0] ?? null;
  }
  if (slot === 'A') {
    return played[1] ?? played[0] ?? null;
  }
  const idx = Number(slot);
  return frets[idx] >= 0 ? idx : null;
}

export default function FingerpickingTrainer() {
  const [chordName, setChordName] = useState('C');
  const [patternKey, setPatternKey] = useState('travis');
  const [bpm, setBpm] = useState(90);
  const [running, setRunning] = useState(false);
  const [slot, setSlot] = useState(-1);

  const chord = GUITAR_CHORDS.find((c) => c.name === chordName) ?? GUITAR_CHORDS[0];
  const pattern = PATTERNS.find((p) => p.key === patternKey) ?? PATTERNS[0];

  const chordRef = useRef(chord);
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    chordRef.current = chord;
  }, [chord]);
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!running) {
      return;
    }
    let i = 0;
    const step = () => {
      const string = resolveSlot(patternRef.current.slots[i], chordRef.current.frets);
      if (string !== null) {
        playTone(midiToFrequency(TUNING_LOW_FIRST[string] + chordRef.current.frets[string]), 1);
      }
      setSlot(i);
      i = (i + 1) % 8;
      timerRef.current = window.setTimeout(step, (60 / bpmRef.current / 2) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setSlot(-1);
    };
  }, [running]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Chord
          </span>
          <Select
            value={chordName}
            onChange={(e) => setChordName(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {GUITAR_CHORDS.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Pattern</span>
          <Select
            value={patternKey}
            onChange={(e) => setPatternKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {PATTERNS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Tempo
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={50}
              max={160}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <ChordDiagram chord={chord} />
          <span className="text-sm font-semibold">{chord.name}</span>
        </div>
        <div className="flex gap-1">
          {pattern.slots.map((s, i) => {
            const string = resolveSlot(s, chord.frets);
            return (
              <div
                key={`slot-${i}`}
                className={`flex h-10 w-8 items-center justify-center rounded border font-mono text-sm ${
                  running && slot === i ? 'border-blue-500 bg-blue-500/20' : 'border-border'
                }`}
              >
                {string === null ? '·' : STRING_LETTERS[string]}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        variant={running ? 'outline' : 'default'}
        className="px-6"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? (
          <>
            <Icon name="square" className="size-3 fill-current" />
            Stop
          </>
        ) : (
          <>
            <Icon name="play" className="size-4" />
            Play
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Each slot shows the string plucked (E A D G B e, low to high; · = rest). Loops one bar of
        eighth notes — follow the highlighted string with your picking hand.
      </p>
    </div>
  );
}
