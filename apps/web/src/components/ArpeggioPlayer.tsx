import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { playTone } from '@/lib/audio';
import { CHORDS, midiToFrequency, pitchName, ROOT_CHOICES } from '@/lib/music-theory';

const PATTERNS = [
  { key: 'up', label: 'Up' },
  { key: 'down', label: 'Down' },
  { key: 'updown', label: 'Up & down' },
  { key: 'downup', label: 'Down & up' },
];

/** Ordered MIDI notes for the arpeggio pattern (root in the C4 octave, plus the octave on top). */
function arpeggioMidis(rootMidi: number, intervals: number[], pattern: string): number[] {
  const ascending = [...intervals.map((i) => rootMidi + i), rootMidi + 12];
  if (pattern === 'down') {
    return [...ascending].reverse();
  }
  if (pattern === 'updown') {
    return [...ascending, ...ascending.slice(1, -1).reverse()];
  }
  if (pattern === 'downup') {
    const descending = [...ascending].reverse();
    return [...descending, ...descending.slice(1, -1).reverse()];
  }
  return ascending;
}

export default function ArpeggioPlayer() {
  const [root, setRoot] = useState(0);
  const [chordKey, setChordKey] = useState('major');
  const [patternKey, setPatternKey] = useState('up');
  const [bpm, setBpm] = useState(120);
  const [running, setRunning] = useState(false);
  const [pos, setPos] = useState(-1);

  const chord = CHORDS.find((c) => c.key === chordKey) ?? CHORDS[0];
  const flats = [1, 3, 5, 8, 10].includes(root);
  const midis = arpeggioMidis(60 + root, chord.intervals, patternKey);

  const midisRef = useRef(midis);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    midisRef.current = midis;
  });
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!running) {
      return;
    }
    let i = 0;
    const step = () => {
      const seq = midisRef.current;
      const note = seq[i % seq.length];
      playTone(midiToFrequency(note), (60 / bpmRef.current) * 0.9);
      setPos(i % seq.length);
      i += 1;
      timerRef.current = window.setTimeout(step, (60 / bpmRef.current / 2) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setPos(-1);
    };
  }, [running]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
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
            Chord
          </span>
          <Select
            value={chordKey}
            onChange={(e) => setChordKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {CHORDS.map((c) => (
              <option key={c.key} value={c.key}>
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
              max={220}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1">
        {midis.map((midi, i) => (
          <div
            key={`n-${i}`}
            className={`flex h-10 w-12 items-center justify-center rounded border text-sm font-medium ${
              running && pos === i ? 'border-blue-500 bg-blue-500/20' : 'border-border'
            }`}
          >
            {pitchName(midi % 12, flats)}
          </div>
        ))}
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
        Arpeggiates the chord (one note at a time) in the chosen direction and loops it — follow the
        highlighted note. Great for building picking and finger independence.
      </p>
    </div>
  );
}
