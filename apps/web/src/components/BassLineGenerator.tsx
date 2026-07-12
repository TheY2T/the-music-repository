import { Button, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { getAudioContext, scheduleDrum, scheduleTone } from '@/lib/audio';
import { midiToFrequency, pitchName } from '@/lib/music-theory';

interface Bar {
  root: number; // pitch class
  third: number; // semitones (3 or 4)
}

interface Progression {
  key: string;
  label: string;
  bars: Bar[];
}

const PROGRESSIONS: Progression[] = [
  {
    key: 'pop',
    label: 'C–Am–F–G',
    bars: [
      { root: 0, third: 4 },
      { root: 9, third: 3 },
      { root: 5, third: 4 },
      { root: 7, third: 4 },
    ],
  },
  {
    key: 'jazz',
    label: 'ii–V–I (Dm–G–C)',
    bars: [
      { root: 2, third: 3 },
      { root: 7, third: 4 },
      { root: 0, third: 4 },
    ],
  },
  {
    key: 'blues',
    label: '12-bar blues (C)',
    bars: [
      { root: 0, third: 4 },
      { root: 5, third: 4 },
      { root: 0, third: 4 },
      { root: 7, third: 4 },
    ],
  },
];

const STYLES = [
  { key: 'root', label: 'Roots' },
  { key: 'root-fifth', label: 'Root–fifth' },
  { key: 'walking', label: 'Walking' },
];

const LOW = 36; // C2
const bassMidi = (pc: number) => LOW + pc;

/** The four bass notes (MIDI, or null for a rest) for one bar in the given style. */
function barNotes(bar: Bar, next: Bar, style: string): (number | null)[] {
  const root = bassMidi(bar.root);
  const fifth = bassMidi(bar.root) + 7;
  const third = bassMidi(bar.root) + bar.third;
  if (style === 'root') {
    return [root, null, root, null];
  }
  if (style === 'root-fifth') {
    return [root, null, fifth, null];
  }
  // walking: root, third, fifth, chromatic approach to the next root.
  const approach = bassMidi(next.root) - 1;
  return [root, third, fifth, approach];
}

export default function BassLineGenerator() {
  const [progKey, setProgKey] = useState('jazz');
  const [style, setStyle] = useState('walking');
  const [bpm, setBpm] = useState(100);
  const [running, setRunning] = useState(false);
  const [bar, setBar] = useState(0);
  const [beat, setBeat] = useState(-1);

  const progression = PROGRESSIONS.find((p) => p.key === progKey) ?? PROGRESSIONS[0];
  const progRef = useRef(progression);
  const styleRef = useRef(style);
  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    progRef.current = progression;
  }, [progression]);
  useEffect(() => {
    styleRef.current = style;
  }, [style]);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!running) {
      return;
    }
    let barIndex = 0;
    let beatIndex = 0;
    const step = () => {
      const ctx = getAudioContext();
      const bars = progRef.current.bars;
      const current = bars[barIndex];
      const nextBar = bars[(barIndex + 1) % bars.length];
      const notes = barNotes(current, nextBar, styleRef.current);
      const note = notes[beatIndex];
      const t = ctx ? ctx.currentTime + 0.02 : 0;
      if (note !== null && ctx) {
        scheduleTone(midiToFrequency(note), t, (60 / bpmRef.current) * 0.9, {
          type: 'sine',
          gain: 0.45,
        });
      }
      if (ctx) {
        scheduleDrum('hihat', t);
      }
      setBar(barIndex);
      setBeat(beatIndex);
      beatIndex += 1;
      if (beatIndex >= 4) {
        beatIndex = 0;
        barIndex = (barIndex + 1) % bars.length;
      }
      timerRef.current = window.setTimeout(step, (60 / bpmRef.current) * 1000);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setBeat(-1);
    };
  }, [running]);

  const currentBar = progression.bars[bar] ?? progression.bars[0];
  const nextBar = progression.bars[(bar + 1) % progression.bars.length];
  const currentNotes = barNotes(currentBar, nextBar, style);

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
          <span className="block font-medium">Bass style</span>
          <Select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {STYLES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
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
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {currentNotes.map((note, i) => (
          <div
            key={`beat-${i}`}
            className={`flex flex-col items-center rounded-md border p-3 ${
              running && beat === i ? 'border-blue-500 bg-blue-500/15' : 'border-border'
            }`}
          >
            <span className="text-lg font-semibold">
              {note === null ? '·' : pitchName(note % 12)}
            </span>
            <span className="text-xs text-muted-foreground">beat {i + 1}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Bar {bar + 1} of {progression.bars.length} — bass over{' '}
        <span className="font-medium text-foreground">{pitchName(currentBar.root)}</span>
      </p>

      <Button
        type="button"
        variant={running ? 'outline' : 'default'}
        className="px-6"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? '■ Stop' : '▶ Play'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Generates a bass line under the progression — <strong>roots</strong>,{' '}
        <strong>root–fifth</strong>, or a <strong>walking</strong> line (root · 3rd · 5th ·
        chromatic approach to the next chord). Follow the highlighted beat.
      </p>
    </div>
  );
}
