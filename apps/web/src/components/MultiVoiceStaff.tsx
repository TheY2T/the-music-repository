import { Button, Select } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { playTone } from '@/lib/audio';
import {
  diatonicChords,
  ledgerSteps,
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
  staffPlacement,
} from '@/lib/music-theory';

const BASE_Y = 108;
const HALF = 8;
const START_X = 78;
const SPACING = 56;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];
const stepY = (step: number) => BASE_Y - step * HALF;

interface StaffPitch {
  step: number;
  accidental: '' | '♯' | '♭';
  midi: number;
}
interface ChordColumn {
  roman: string;
  name: string;
  pitches: StaffPitch[];
}

/** Stack a chord's pitch classes into ascending MIDI notes in the C4 octave and up. */
function toAscending(pitchClasses: number[]): number[] {
  const out = [60 + pitchClasses[0]];
  for (let i = 1; i < pitchClasses.length; i += 1) {
    let midi = out[i - 1] - (out[i - 1] % 12) + pitchClasses[i];
    while (midi <= out[i - 1]) {
      midi += 12;
    }
    out.push(midi);
  }
  return out;
}

function buildColumns(root: number, flats: boolean): ChordColumn[] {
  return diatonicChords(root, flats).map((chord) => ({
    roman: chord.roman,
    name: chord.name,
    pitches: toAscending(chord.pitchClasses).map((midi) => {
      const placement = staffPlacement(midi, flats);
      return { step: placement.step, accidental: placement.accidental, midi };
    }),
  }));
}

export default function MultiVoiceStaff() {
  const [root, setRoot] = useState(0);
  const [active, setActive] = useState(-1);
  const [running, setRunning] = useState(false);

  const flats = [1, 3, 5, 8, 10].includes(root);
  const columns = buildColumns(root, flats);
  const width = START_X + columns.length * SPACING + 20;

  const columnsRef = useRef(columns);
  const timerRef = useRef(0);
  useEffect(() => {
    columnsRef.current = columns;
  });

  function playChord(pitches: StaffPitch[]) {
    for (const p of pitches) {
      playTone(midiToFrequency(p.midi), 1.2);
    }
  }

  useEffect(() => {
    if (!running) {
      return;
    }
    let i = 0;
    const step = () => {
      const cols = columnsRef.current;
      playChord(cols[i].pitches);
      setActive(i);
      i += 1;
      if (i >= cols.length) {
        setRunning(false);
        return;
      }
      timerRef.current = window.setTimeout(step, 900);
    };
    step();
    return () => {
      window.clearTimeout(timerRef.current);
      setActive(-1);
    };
  }, [running]);

  return (
    <div className="space-y-4">
      <label className="space-y-1 text-sm">
        <span className="block font-medium" data-help="chords">
          Key
        </span>
        <Select
          value={root}
          onChange={(e) => setRoot(Number(e.target.value))}
          className="h-auto w-auto px-2 py-1"
        >
          {ROOT_CHOICES.map((pc) => (
            <option key={pc} value={pc}>
              {pitchName(pc)} major
            </option>
          ))}
        </Select>
      </label>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} 160`}
          className="min-w-[640px]"
          role="img"
          aria-label="Diatonic triads on a treble staff"
        >
          {STAFF_LINE_STEPS.map((line) => (
            <line
              key={line}
              x1={20}
              x2={width - 10}
              y1={stepY(line)}
              y2={stepY(line)}
              className="stroke-border"
              strokeWidth={1.5}
            />
          ))}
          <text x={26} y={stepY(2) + 20} className="fill-foreground" fontSize={64}>
            𝄞
          </text>
          {columns.map((col, index) => {
            const x = START_X + index * SPACING;
            const isActive = index === active;
            const noteClass = isActive ? 'fill-blue-600' : 'fill-foreground';
            const ledgers = new Set<number>();
            for (const p of col.pitches) {
              for (const l of ledgerSteps(p.step)) {
                ledgers.add(l);
              }
            }
            return (
              <g key={col.roman}>
                {isActive ? (
                  <rect
                    x={x - SPACING / 2}
                    y={2}
                    width={SPACING}
                    height={128}
                    className="fill-blue-500/15"
                  />
                ) : null}
                {[...ledgers].map((l) => (
                  <line
                    key={l}
                    x1={x - 12}
                    x2={x + 12}
                    y1={stepY(l)}
                    y2={stepY(l)}
                    className="stroke-border"
                    strokeWidth={1.5}
                  />
                ))}
                {col.pitches.map((p, pi) => (
                  <g key={p.midi}>
                    {p.accidental ? (
                      <text
                        x={x - 13 - (pi % 2) * 8}
                        y={stepY(p.step) + 5}
                        textAnchor="middle"
                        className={noteClass}
                        fontSize={16}
                      >
                        {p.accidental}
                      </text>
                    ) : null}
                    <ellipse cx={x} cy={stepY(p.step)} rx={7.5} ry={5.5} className={noteClass} />
                  </g>
                ))}
                <text
                  x={x}
                  y={148}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[12px]"
                >
                  {col.roman}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {columns.map((col) => (
          <Button
            key={col.roman}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => playChord(col.pitches)}
          >
            {col.roman} · {col.name}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant={running ? 'outline' : 'default'}
        className="px-6"
        onClick={() => setRunning((r) => !r)}
      >
        {running ? '■ Stop' : '▶ Play all'}
      </Button>
      <p className="text-xs text-muted-foreground">
        The seven diatonic triads of the key, engraved as **stacked chords** on the staff (multiple
        noteheads per beat, with shared ledger lines and accidentals). Click any chord to hear it.
      </p>
    </div>
  );
}
