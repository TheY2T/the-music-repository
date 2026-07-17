import type { Locale } from '@TheY2T/tmr-i18n';
import { type TabStep, tabToAlphaTex } from '@TheY2T/tmr-music-core/score/alphatex';
import { Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import ScorePlayer from './ScorePlayer';

interface TabNote {
  string: number; // 0 = high e … 5 = low E
  fret: number;
  /** Bend up this many semitones (whole-step = 2). */
  bend?: number;
  /** Slide to this fret on the same string. */
  slideTo?: number;
  /** Hammer-on / pull-off to this fret on the same string (legato). */
  legatoTo?: number;
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

// Guitar tab tuning, alphaTab string order (string 1 = high e). Matches STANDARD_TUNING high-e-first.
const LICK_TUNING = [64, 59, 55, 50, 45, 40];

/** Convert a lick's steps to a guitar-tab alphaTex line (bends/slides/hammers → alphaTab tab effects).
 * Steps are eighth notes; double-stops keep their first note (the melodic voice). String index 0 =
 * high e maps to alphaTab string 1. */
function lickToAlphaTex(lick: Lick): string {
  const steps: TabStep[] = lick.steps.map((step) => {
    const note = step[0];
    return {
      string: note.string + 1,
      fret: note.fret,
      beats: 0.5,
      bend: !!note.bend,
      slideTo: note.slideTo,
      hammerTo: note.legatoTo,
    };
  });
  return tabToAlphaTex(steps, LICK_TUNING, { title: lick.title, tempo: 110, beatsPerBar: 4 });
}

export default function LickLibrary({ locale }: { locale: Locale }) {
  const [category, setCategory] = useState('all');
  const licks = LICKS.filter((lick) => category === 'all' || lick.category === category);
  const [lickKey, setLickKey] = useState(licks[0]?.key ?? '');
  const lick = licks.find((l) => l.key === lickKey) ?? licks[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Category</span>
          <Select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              const next = LICKS.filter(
                (l) => e.target.value === 'all' || l.category === e.target.value,
              );
              setLickKey(next[0]?.key ?? '');
            }}
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
          <span className="block font-medium" data-help="improvisation">
            Lick
          </span>
          <Select
            value={lick?.key ?? ''}
            onChange={(e) => setLickKey(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {licks.map((l) => (
              <option key={l.key} value={l.key}>
                {l.title}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {lick ? (
        <>
          <p className="text-sm text-muted-foreground">{lick.context}</p>
          {/* Rendered as real tab by alphaTab — bends/slides/hammer-ons play with its synth. Re-key on
              the lick so the score reloads; the tempo slider (in ScorePlayer) is the practice control. */}
          <ScorePlayer
            key={lick.key}
            tex={lickToAlphaTex(lick)}
            mode="tab"
            tuning={LICK_TUNING}
            locale={locale}
            interactive
          />
        </>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Pick a lick to see it in tab and standard notation. Press Play to hear it, and use the tempo
        slider to work it up to speed. Bends, slides, and hammer-ons/pull-offs are rendered + played
        by alphaTab.
      </p>
    </div>
  );
}
