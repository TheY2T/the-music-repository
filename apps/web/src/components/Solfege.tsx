import { Button, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { playTone } from '@/lib/audio';
import { midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

const POOL = trebleStaffNotes().filter((n) => n.midi >= 60 && n.midi <= 72);

// Movable-do (C major): letter → solfège syllable / scale degree.
const SOLFEGE: Record<string, string> = {
  C: 'do',
  D: 're',
  E: 'mi',
  F: 'fa',
  G: 'sol',
  A: 'la',
  B: 'ti',
};
const DEGREE: Record<string, string> = { C: '1', D: '2', E: '3', F: '4', G: '5', A: '6', B: '7' };

interface SolNote {
  step: number;
  name: string;
  midi: number;
}

function generate(length: number): SolNote[] {
  const notes: SolNote[] = [];
  let idx = 2 + Math.floor(Math.random() * (POOL.length - 4));
  for (let i = 0; i < length; i += 1) {
    const n = POOL[idx];
    notes.push({ step: n.step, name: n.name, midi: n.midi });
    let move = 0;
    while (move === 0) {
      move = Math.floor(Math.random() * 5) - 2;
    }
    idx = Math.max(0, Math.min(POOL.length - 1, idx + move));
  }
  return notes;
}

const MODES = [
  { key: 'solfege', label: 'Solfège (do re mi)' },
  { key: 'degree', label: 'Scale degrees (1–7)' },
  { key: 'name', label: 'Note names' },
];

function labelFor(name: string, mode: string): string {
  const letter = name[0];
  if (mode === 'solfege') {
    return SOLFEGE[letter] ?? name;
  }
  if (mode === 'degree') {
    return DEGREE[letter] ?? name;
  }
  return name;
}

export default function Solfege() {
  const [mode, setMode] = useState('solfege');
  const [melody, setMelody] = useState<SolNote[]>(() => generate(6));

  const notes: StaffNoteDatum[] = melody.map((n) => ({
    step: n.step,
    label: labelFor(n.name, mode),
  }));

  function play() {
    melody.forEach((n, i) => {
      window.setTimeout(() => playTone(midiToFrequency(n.midi), 0.5), i * 550);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="scales">
            Labels
          </span>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="h-auto w-auto px-2 py-1"
          >
            {MODES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </Select>
        </label>
        <Button type="button" onClick={play}>
          ▶ Play
        </Button>
        <Button type="button" variant="outline" onClick={() => setMelody(generate(6))}>
          ↻ New melody
        </Button>
      </div>

      <StaffSequence notes={notes} showLabels />

      <p className="text-xs text-muted-foreground">
        Sing the melody (C major) using <strong>movable-do</strong> solfège or scale degrees, then
        press Play to check yourself. Switch labels to connect syllables, numbers, and note names.
      </p>
    </div>
  );
}
