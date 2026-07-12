import { useEffect, useRef, useState } from 'react';
import { playTone } from '@/lib/audio';
import { midiToFrequency, STANDARD_TUNING } from '@/lib/music-theory';

// String index 0 = high E … 5 = low E (matches STANDARD_TUNING order).
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];

interface TabNote {
  string: number;
  fret: number;
}
/** Each step is one rhythmic position; usually one note, sometimes a double-stop. */
type Step = TabNote[];

interface Lick {
  key: string;
  title: string;
  context: string;
  category: 'blues' | 'rock' | 'turnaround';
  steps: Step[];
}

const LICKS: Lick[] = [
  {
    key: 'a-pent-run',
    title: 'A minor pentatonic run',
    context: 'Box 1, key of A — descending',
    category: 'blues',
    steps: [
      [{ string: 1, fret: 8 }],
      [{ string: 1, fret: 5 }],
      [{ string: 2, fret: 7 }],
      [{ string: 2, fret: 5 }],
      [{ string: 3, fret: 7 }],
      [{ string: 3, fret: 5 }],
      [{ string: 4, fret: 7 }],
      [{ string: 4, fret: 5 }],
      [{ string: 5, fret: 8 }],
      [{ string: 5, fret: 5 }],
    ],
  },
  {
    key: 'bb-lick',
    title: 'B.B. King-style blues lick',
    context: 'Key of A — high box phrase',
    category: 'blues',
    steps: [
      [{ string: 0, fret: 8 }],
      [{ string: 0, fret: 5 }],
      [{ string: 1, fret: 8 }],
      [{ string: 1, fret: 5 }],
      [{ string: 2, fret: 7 }],
      [{ string: 2, fret: 5 }],
    ],
  },
  {
    key: 'boogie',
    title: 'Rock double-stop boogie',
    context: 'Key of A — Chuck Berry style',
    category: 'rock',
    steps: [
      [
        { string: 3, fret: 7 },
        { string: 2, fret: 7 },
      ],
      [
        { string: 3, fret: 5 },
        { string: 2, fret: 5 },
      ],
      [
        { string: 3, fret: 7 },
        { string: 2, fret: 7 },
      ],
      [
        { string: 3, fret: 5 },
        { string: 2, fret: 5 },
      ],
    ],
  },
  {
    key: 'e-turnaround',
    title: 'E blues turnaround',
    context: 'Key of E — chromatic descent, resolving to E',
    category: 'turnaround',
    steps: [
      [
        { string: 0, fret: 3 },
        { string: 2, fret: 4 },
      ],
      [
        { string: 0, fret: 2 },
        { string: 2, fret: 3 },
      ],
      [
        { string: 0, fret: 1 },
        { string: 2, fret: 2 },
      ],
      [
        { string: 0, fret: 0 },
        { string: 2, fret: 1 },
      ],
      [{ string: 5, fret: 0 }],
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'blues', label: 'Blues licks' },
  { key: 'rock', label: 'Rock riffs' },
  { key: 'turnaround', label: 'Turnarounds' },
];

function Tab({ steps, activeStep }: { steps: Step[]; activeStep: number }) {
  return (
    <div className="flex overflow-x-auto font-mono text-xs">
      <div className="flex flex-col pr-1 text-muted-foreground">
        {STRING_LABELS.map((label) => (
          <span key={label} className="flex h-5 items-center">
            {label}
          </span>
        ))}
      </div>
      {steps.map((step, columnIndex) => (
        <div
          key={`col-${columnIndex}`}
          className={`flex w-6 flex-col rounded ${
            columnIndex === activeStep ? 'bg-blue-500/20' : ''
          }`}
        >
          {STRING_LABELS.map((label, stringIndex) => {
            const note = step.find((n) => n.string === stringIndex);
            return (
              <span key={label} className="flex h-5 items-center justify-center text-foreground">
                {note ? note.fret : '–'}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function LickLibrary() {
  const [category, setCategory] = useState('all');
  const [bpm, setBpm] = useState(110);
  const [playing, setPlaying] = useState<{ lick: string; step: number } | null>(null);

  const bpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const licks = LICKS.filter((lick) => category === 'all' || lick.category === category);

  function playLick(lick: Lick) {
    window.clearTimeout(timerRef.current);
    let i = 0;
    const run = () => {
      if (i >= lick.steps.length) {
        setPlaying(null);
        return;
      }
      const step = lick.steps[i];
      const noteSeconds = (60 / bpmRef.current) * 0.9;
      for (const note of step) {
        playTone(midiToFrequency(STANDARD_TUNING[note.string] + note.fret), noteSeconds);
      }
      setPlaying({ lick: lick.key, step: i });
      i += 1;
      timerRef.current = window.setTimeout(run, 60000 / bpmRef.current);
    };
    run();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="rhythm">
            Tempo
          </span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={50}
              max={200}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-40"
              aria-label="Tempo (BPM)"
            />
            <span className="w-16 tabular-nums text-sm text-muted-foreground">{bpm} BPM</span>
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {licks.map((lick) => (
          <div key={lick.key} className="space-y-2 rounded-lg border border-border p-3">
            <div>
              <span className="font-semibold" data-help="improvisation">
                {lick.title}
              </span>
              <p className="text-xs text-muted-foreground">{lick.context}</p>
            </div>
            <Tab steps={lick.steps} activeStep={playing?.lick === lick.key ? playing.step : -1} />
            <button
              type="button"
              onClick={() => playLick(lick)}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
            >
              ▶ Play
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Read the tab (string names on the left, fret numbers in sequence), press Play to hear it,
        then work it up to speed with the tempo slider. Numbers stacked in a column are played
        together.
      </p>
    </div>
  );
}
