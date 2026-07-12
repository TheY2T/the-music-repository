import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { ChordDiagram, GUITAR_CHORDS, strumChord } from '@/components/ChordDiagrams';

type Strum = 'D' | 'U' | '-';

interface Pattern {
  key: string;
  label: string;
  /** Eight eighth-note slots (one bar in 4/4). */
  slots: Strum[];
}

const PATTERNS: Pattern[] = [
  { key: 'downs', label: 'All downs', slots: ['D', '-', 'D', '-', 'D', '-', 'D', '-'] },
  { key: 'eighths', label: 'Down-up eighths', slots: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'] },
  { key: 'pop', label: 'D–DU–UDU (pop)', slots: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'] },
  { key: 'folk', label: 'Folk', slots: ['D', 'D', 'U', '-', 'U', 'D', 'U', '-'] },
];

export default function StrummingTrainer() {
  const [chordName, setChordName] = useState('G');
  const [patternKey, setPatternKey] = useState('pop');
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
      const s = patternRef.current.slots[i];
      if (s === 'D') {
        strumChord(chordRef.current.frets, 'down');
      } else if (s === 'U') {
        strumChord(chordRef.current.frets, 'up');
      }
      setSlot(i);
      i = (i + 1) % 8;
      // Each slot is one eighth note.
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
          {pattern.slots.map((s, i) => (
            <div
              key={`slot-${i}`}
              className={`flex h-10 w-8 items-center justify-center rounded border text-lg font-semibold ${
                running && slot === i ? 'border-blue-500 bg-blue-500/20' : 'border-border'
              } ${s === '-' ? 'text-muted-foreground' : ''}`}
            >
              {s === 'D' ? '↓' : s === 'U' ? '↑' : '·'}
            </div>
          ))}
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
        ↓ = downstroke (strum low to high), ↑ = upstroke, · = skip. Loops one bar of eighth notes —
        strum along with the highlighted beat.
      </p>
    </div>
  );
}
