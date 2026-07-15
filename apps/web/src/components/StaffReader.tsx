import { SegmentedToggle } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import { playTone } from '@/lib/audio';
import { bassStaffNotes, ledgerSteps, midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

const BASE_Y = 116; // y of the bottom staff line (step 0)
const HALF = 8; // px per diatonic half-step
const START_X = 66;
const SPACING = 34;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];

type Clef = 'treble' | 'bass';
const CLEFS: Record<
  Clef,
  { notes: ReturnType<typeof trebleStaffNotes>; glyph: string; glyphStep: number }
> = {
  // The clef glyph is drawn centred on its reference line: treble G curls on G4 (step 2), bass F sits on F3 (step 6).
  treble: { notes: trebleStaffNotes(), glyph: '𝄞', glyphStep: 2 },
  bass: { notes: bassStaffNotes(), glyph: '𝄢', glyphStep: 6 },
};

const CLEF_OPTIONS = [
  { value: 'treble' as Clef, label: 'Treble' },
  { value: 'bass' as Clef, label: 'Bass' },
];

const stepY = (step: number) => BASE_Y - step * HALF;

export default function StaffReader() {
  const [clef, setClef] = useState<Clef>('treble');
  const [selected, setSelected] = useState<string | null>(null);

  const { notes, glyph, glyphStep } = CLEFS[clef];
  const width = START_X + notes.length * SPACING + 20;

  function play(note: (typeof notes)[number]) {
    playTone(midiToFrequency(note.midi));
    setSelected(note.name);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-sm">
        <span className="block font-medium" data-help="staff">
          Clef
        </span>
        <SegmentedToggle
          options={CLEF_OPTIONS}
          value={clef}
          onValueChange={(next) => {
            setClef(next);
            setSelected(null);
          }}
          aria-label="Clef"
        />
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} 150`}
          className="min-w-[640px]"
          role="img"
          aria-label={`${clef === 'treble' ? 'Treble' : 'Bass'} staff — natural notes`}
        >
          {STAFF_LINE_STEPS.map((step) => (
            <line
              key={step}
              x1={20}
              x2={width - 10}
              y1={stepY(step)}
              y2={stepY(step)}
              className="stroke-border"
              strokeWidth={1.5}
            />
          ))}
          <text x={24} y={stepY(glyphStep) + 20} className="fill-foreground" fontSize={64}>
            {glyph}
          </text>

          {notes.map((note, index) => {
            const x = START_X + index * SPACING;
            const y = stepY(note.step);
            const isSelected = selected === note.name;
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG group — a <button> is not valid inside <svg>.
              <g
                key={note.name}
                onClick={() => play(note)}
                className="cursor-pointer"
                role="button"
                aria-label={note.name}
              >
                {ledgerSteps(note.step).map((ledger) => (
                  <line
                    key={ledger}
                    x1={x - 12}
                    x2={x + 12}
                    y1={stepY(ledger)}
                    y2={stepY(ledger)}
                    className="stroke-border"
                    strokeWidth={1.5}
                  />
                ))}
                <ellipse
                  cx={x}
                  cy={y}
                  rx={7.5}
                  ry={5.5}
                  className={isSelected ? 'fill-blue-500' : 'fill-foreground'}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">
        Click a note to hear it. Selected:{' '}
        <span className="font-mono text-foreground">{selected ?? '—'}</span>
      </p>
    </div>
  );
}
