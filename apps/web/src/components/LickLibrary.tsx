import { Button, Card, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { playGlide, playTone } from '@/lib/audio';
import { midiToFrequency, STANDARD_TUNING } from '@/lib/music-theory';

// String index 0 = high E … 5 = low E (matches STANDARD_TUNING order).
const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E'];

interface TabNote {
  string: number;
  fret: number;
  /** Bend up this many semitones (whole-step = 2). */
  bend?: number;
  /** Slide to this fret on the same string. */
  slideTo?: number;
  /** Hammer-on / pull-off to this fret on the same string (legato). */
  legatoTo?: number;
}

/** Tab cell text: "7" plain, "7b" bend, "5/7" slide, "5h7"/"7p5" hammer-on/pull-off. */
function cellText(note: TabNote): string {
  if (note.bend) {
    return `${note.fret}b`;
  }
  if (note.slideTo !== undefined) {
    return `${note.fret}/${note.slideTo}`;
  }
  if (note.legatoTo !== undefined) {
    return `${note.fret}${note.legatoTo > note.fret ? 'h' : 'p'}${note.legatoTo}`;
  }
  return String(note.fret);
}
/** Each step is one rhythmic position; usually one note, sometimes a double-stop. */
type Step = TabNote[];

interface Lick {
  key: string;
  title: string;
  context: string;
  category: 'blues' | 'rock' | 'turnaround' | 'jazz' | 'country' | 'funk';
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
    key: 'bend-lick',
    title: 'Blues bend lick',
    context: 'Key of A — whole-step bend on the G string',
    category: 'blues',
    steps: [
      [{ string: 1, fret: 8 }],
      [{ string: 2, fret: 7, bend: 2 }],
      [{ string: 1, fret: 5 }],
      [{ string: 2, fret: 5 }],
    ],
  },
  {
    key: 'slide-lick',
    title: 'Sliding rock lick',
    context: 'Key of A — slide up the D string',
    category: 'rock',
    steps: [
      [{ string: 3, fret: 5, slideTo: 7 }],
      [{ string: 2, fret: 5 }],
      [{ string: 2, fret: 7 }],
      [{ string: 1, fret: 5 }],
    ],
  },
  {
    key: 'legato-lick',
    title: 'Legato pentatonic lick',
    context: 'Key of A — hammer-ons and a pull-off',
    category: 'blues',
    steps: [
      [{ string: 3, fret: 5, legatoTo: 7 }],
      [{ string: 2, fret: 5, legatoTo: 7 }],
      [{ string: 1, fret: 5 }],
      [{ string: 1, fret: 8, legatoTo: 5 }],
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
  {
    key: 'jazz-ii-v-i',
    title: 'Bebop ii–V–I line',
    context: 'Key of C — Dm7 → G7 → C, enclosing the 3rd',
    category: 'jazz',
    steps: [
      [{ string: 2, fret: 7 }], // A (Dm7)
      [{ string: 2, fret: 5 }], // G
      [{ string: 3, fret: 7 }], // A
      [{ string: 3, fret: 5 }], // G
      [{ string: 3, fret: 4 }], // F# (G7 approach)
      [{ string: 3, fret: 5 }], // G
      [{ string: 2, fret: 5 }], // B (G7 3rd)
      [{ string: 2, fret: 4 }], // Bb
      [{ string: 2, fret: 5 }], // B → resolves to C
      [{ string: 1, fret: 5 }], // E (C maj 3rd)
    ],
  },
  {
    key: 'country-double-stops',
    title: 'Country double-stop lick',
    context: 'Key of G — chicken-pickin’ 6ths with a bend',
    category: 'country',
    steps: [
      [
        { string: 1, fret: 8 },
        { string: 3, fret: 7 },
      ],
      [
        { string: 1, fret: 7, bend: 1 },
        { string: 3, fret: 5 },
      ],
      [
        { string: 1, fret: 5 },
        { string: 3, fret: 4 },
      ],
      [{ string: 2, fret: 4 }],
      [{ string: 2, fret: 5 }],
    ],
  },
  {
    key: 'funk-16ths',
    title: 'Funk 16th-note lick',
    context: 'Key of E — muted, syncopated single notes',
    category: 'funk',
    steps: [
      [{ string: 3, fret: 2 }], // E
      [{ string: 2, fret: 2 }], // A
      [{ string: 2, fret: 4 }], // B
      [{ string: 3, fret: 2 }], // E
      [{ string: 2, fret: 2, legatoTo: 4 }], // A→B hammer
      [{ string: 1, fret: 3 }], // G
      [{ string: 1, fret: 2 }], // F#
      [{ string: 2, fret: 4 }], // B
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'blues', label: 'Blues licks' },
  { key: 'rock', label: 'Rock riffs' },
  { key: 'jazz', label: 'Jazz lines' },
  { key: 'country', label: 'Country' },
  { key: 'funk', label: 'Funk' },
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
          className={`flex w-10 flex-col rounded ${
            columnIndex === activeStep ? 'bg-blue-500/20' : ''
          }`}
        >
          {STRING_LABELS.map((label, stringIndex) => {
            const note = step.find((n) => n.string === stringIndex);
            return (
              <span key={label} className="flex h-5 items-center justify-center text-foreground">
                {note ? cellText(note) : '–'}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const SPEED_STEP = 15; // BPM added per pass in the speed trainer
const SPEED_PASSES = 4; // number of accelerating passes

export default function LickLibrary() {
  const [category, setCategory] = useState('all');
  const [bpm, setBpm] = useState(110);
  const [speedTrainer, setSpeedTrainer] = useState(false);
  const [playing, setPlaying] = useState<{ lick: string; step: number } | null>(null);

  const bpmRef = useRef(bpm);
  const trainerRef = useRef(speedTrainer);
  const startBpmRef = useRef(bpm);
  const timerRef = useRef(0);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    trainerRef.current = speedTrainer;
  }, [speedTrainer]);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const licks = LICKS.filter((lick) => category === 'all' || lick.category === category);

  function playLick(lick: Lick) {
    window.clearTimeout(timerRef.current);
    startBpmRef.current = bpmRef.current;
    let i = 0;
    const run = () => {
      if (i >= lick.steps.length) {
        // Speed trainer: replay faster each pass until the target tempo.
        if (trainerRef.current) {
          const next = Math.min(
            bpmRef.current + SPEED_STEP,
            startBpmRef.current + SPEED_STEP * SPEED_PASSES,
          );
          if (next > bpmRef.current) {
            bpmRef.current = next;
            setBpm(next);
            i = 0;
            timerRef.current = window.setTimeout(run, 60000 / next);
            return;
          }
        }
        setPlaying(null);
        return;
      }
      const step = lick.steps[i];
      const noteSeconds = (60 / bpmRef.current) * 0.9;
      for (const note of step) {
        const from = STANDARD_TUNING[note.string] + note.fret;
        if (note.bend) {
          playGlide(midiToFrequency(from), midiToFrequency(from + note.bend), noteSeconds);
        } else if (note.slideTo !== undefined) {
          playGlide(
            midiToFrequency(from),
            midiToFrequency(STANDARD_TUNING[note.string] + note.slideTo),
            noteSeconds,
          );
        } else if (note.legatoTo !== undefined) {
          // Hammer-on / pull-off: sound the first note, then the second legato and softer.
          playTone(midiToFrequency(from), noteSeconds);
          const target = STANDARD_TUNING[note.string] + note.legatoTo;
          window.setTimeout(
            () => playTone(midiToFrequency(target), noteSeconds * 0.6),
            noteSeconds * 350,
          );
        } else {
          playTone(midiToFrequency(from), noteSeconds);
        }
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={speedTrainer}
            onChange={(e) => setSpeedTrainer(e.target.checked)}
          />
          Speed trainer (+{SPEED_STEP} BPM/pass)
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {licks.map((lick) => (
          <Card key={lick.key} className="space-y-2 p-3">
            <div>
              <span className="font-semibold" data-help="improvisation">
                {lick.title}
              </span>
              <p className="text-xs text-muted-foreground">{lick.context}</p>
            </div>
            <Tab steps={lick.steps} activeStep={playing?.lick === lick.key ? playing.step : -1} />
            <Button type="button" size="sm" onClick={() => playLick(lick)}>
              ▶ Play
            </Button>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Read the tab (string names on the left, fret numbers in sequence), press Play to hear it,
        then work it up to speed with the tempo slider. Numbers stacked in a column are played
        together; <span className="font-mono">7b</span> = bend up,{' '}
        <span className="font-mono">5/7</span> = slide, and <span className="font-mono">5h7</span> /{' '}
        <span className="font-mono">7p5</span> = hammer-on / pull-off.
      </p>
    </div>
  );
}
