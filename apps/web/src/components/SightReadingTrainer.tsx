import { useEffect, useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { playTone } from '@/lib/audio';
import { midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

// C-major naturals C4–C6, low to high — the note pool (renders without accidentals).
const NATURALS = trebleStaffNotes();

interface MelodyNote extends StaffNoteDatum {
  midi: number;
}

function generateMelody(count: number, maxLeap: number): MelodyNote[] {
  const melody: MelodyNote[] = [];
  let position = 3 + Math.floor(Math.random() * (NATURALS.length - 6)); // start mid-staff
  for (let i = 0; i < count; i += 1) {
    const note = NATURALS[position];
    melody.push({ step: note.step, label: note.name, midi: note.midi });
    let leap = 0;
    while (leap === 0) {
      leap = Math.floor(Math.random() * (2 * maxLeap + 1)) - maxLeap;
    }
    position = Math.max(0, Math.min(NATURALS.length - 1, position + leap));
  }
  return melody;
}

const LENGTHS = [4, 8, 12];
const MOTIONS = [
  { key: 'steps', label: 'Steps only', maxLeap: 1 },
  { key: 'leaps', label: 'Small leaps', maxLeap: 3 },
];

export default function SightReadingTrainer() {
  const [length, setLength] = useState(8);
  const [motion, setMotion] = useState('steps');
  const [showLabels, setShowLabels] = useState(false);
  const [seed, setSeed] = useState(0);
  const [melody, setMelody] = useState<MelodyNote[]>([]);

  useEffect(() => {
    const maxLeap = MOTIONS.find((m) => m.key === motion)?.maxLeap ?? 1;
    setMelody(generateMelody(length, maxLeap));
    setShowLabels(false);
  }, [length, motion, seed]);

  function play() {
    melody.forEach((note, index) => {
      window.setTimeout(() => playTone(midiToFrequency(note.midi), 0.5), index * 500);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="sight-reading">
            Notes
          </span>
          <select
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {LENGTHS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Motion</span>
          <select
            value={motion}
            onChange={(e) => setMotion(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {MOTIONS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Reveal note names
        </label>
      </div>

      <StaffSequence notes={melody} showLabels={showLabels} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={play}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium"
        >
          ↻ New melody
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Read the notes (C major), sing or play them, then press Play to check — reveal the names if
        you get stuck.
      </p>
    </div>
  );
}
