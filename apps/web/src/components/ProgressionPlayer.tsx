import { Button, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { ChordDiagram, GUITAR_CHORDS, strumChord } from '@/components/ChordDiagrams';

type Strum = 'D' | 'U' | '-';

const PATTERNS: { key: string; label: string; slots: Strum[] }[] = [
  { key: 'downs', label: 'All downs', slots: ['D', '-', 'D', '-', 'D', '-', 'D', '-'] },
  { key: 'pop', label: 'D–DU–UDU (pop)', slots: ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'] },
  { key: 'folk', label: 'Folk', slots: ['D', 'D', 'U', '-', 'U', 'D', 'U', '-'] },
];

const PROGRESSIONS: { key: string; label: string; chords: string[] }[] = [
  { key: 'pop', label: 'C–G–Am–F', chords: ['C', 'G', 'Am', 'F'] },
  { key: 'fifties', label: 'C–Am–F–G', chords: ['C', 'Am', 'F', 'G'] },
  { key: 'g-axis', label: 'G–D–Em–C', chords: ['G', 'D', 'Em', 'C'] },
  { key: 'vi-iv-i-v', label: 'Am–F–C–G', chords: ['Am', 'F', 'C', 'G'] },
];

const chordByName = (name: string) =>
  GUITAR_CHORDS.find((c) => c.name === name) ?? GUITAR_CHORDS[0];

export default function ProgressionPlayer() {
  const [progKey, setProgKey] = useState('pop');
  const [patternKey, setPatternKey] = useState('pop');
  const [bpm, setBpm] = useState(90);
  const [running, setRunning] = useState(false);
  const [bar, setBar] = useState(0);
  const [slot, setSlot] = useState(-1);

  const progression = PROGRESSIONS.find((p) => p.key === progKey) ?? PROGRESSIONS[0];
  const pattern = PATTERNS.find((p) => p.key === patternKey) ?? PATTERNS[0];

  const progRef = useRef(progression);
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    progRef.current = progression;
  }, [progression]);
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
    let barIndex = 0;
    let i = 0;
    const step = () => {
      const chords = progRef.current.chords;
      const chord = chordByName(chords[barIndex]);
      const s = patternRef.current.slots[i];
      if (s === 'D') {
        strumChord(chord.frets, 'down');
      } else if (s === 'U') {
        strumChord(chord.frets, 'up');
      }
      setBar(barIndex);
      setSlot(i);
      i += 1;
      if (i >= 8) {
        i = 0;
        barIndex = (barIndex + 1) % chords.length;
      }
      timerRef.current = window.setTimeout(step, (60 / bpmRef.current / 2) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setSlot(-1);
      setBar(0);
    };
  }, [running]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="chords">
            Progression
          </span>
          <Select
            value={progKey}
            onChange={(e) => setProgKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {PROGRESSIONS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Strum</span>
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

      <div className="flex flex-wrap gap-4">
        {progression.chords.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
              running && bar === i ? 'border-blue-500 bg-blue-500/10' : 'border-border'
            }`}
          >
            <ChordDiagram chord={chordByName(name)} />
            <span className="text-sm font-semibold">{name}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1">
        {pattern.slots.map((s, i) => (
          <div
            key={`slot-${i}`}
            className={`flex h-9 w-8 items-center justify-center rounded border text-lg font-semibold ${
              running && slot === i ? 'border-blue-500 bg-blue-500/20' : 'border-border'
            } ${s === '-' ? 'text-muted-foreground' : ''}`}
          >
            {s === 'D' ? '↓' : s === 'U' ? '↑' : '·'}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant={running ? 'outline' : 'default'}
        className="px-6"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? '■ Stop' : '▶ Play'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Loops the progression — one bar per chord — with your chosen strum. Follow the highlighted
        chord and strum along; change tempo to build it up.
      </p>
    </div>
  );
}
