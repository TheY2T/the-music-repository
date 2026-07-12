import { useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { playTone } from '@/lib/audio';
import { midiToFrequency, trebleStaffNotes } from '@/lib/music-theory';

// One-octave pool C4–C5 so the answer palette covers every note the generator can pick.
const POOL = trebleStaffNotes().filter((n) => n.midi >= 60 && n.midi <= 72);

interface DictNote extends StaffNoteDatum {
  midi: number;
}

function generate(length: number): DictNote[] {
  const notes: DictNote[] = [];
  let idx = 2 + Math.floor(Math.random() * (POOL.length - 4)); // start mid-range
  for (let i = 0; i < length; i += 1) {
    const n = POOL[idx];
    notes.push({ step: n.step, label: n.name, midi: n.midi });
    let move = 0;
    while (move === 0) {
      move = Math.floor(Math.random() * 5) - 2; // ±1 or ±2 (stepwise / small leap)
    }
    idx = Math.max(0, Math.min(POOL.length - 1, idx + move));
  }
  return notes;
}

const LENGTHS = [3, 4, 5];

export default function MelodicDictation() {
  const [length, setLength] = useState(4);
  const [melody, setMelody] = useState<DictNote[]>(() => generate(4));
  const [answer, setAnswer] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function play() {
    melody.forEach((n, i) => {
      window.setTimeout(() => playTone(midiToFrequency(n.midi), 0.5), i * 550);
    });
  }

  function newMelody(len = length) {
    setMelody(generate(len));
    setAnswer([]);
    setChecked(null);
    setRevealed(false);
  }

  function pick(name: string) {
    if (checked || answer.length >= melody.length) {
      return;
    }
    const note = POOL.find((n) => n.name === name);
    if (note) {
      playTone(midiToFrequency(note.midi), 0.4);
    }
    setAnswer((a) => [...a, name]);
  }

  function check() {
    const result = melody.map((n, i) => answer[i] === n.label);
    setChecked(result);
    setScore((s) => ({
      correct: s.correct + (result.every(Boolean) ? 1 : 0),
      total: s.total + 1,
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={play}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ▶ Play melody
        </button>
        <label className="flex items-center gap-2 text-sm">
          Notes
          <select
            value={length}
            onChange={(e) => {
              const n = Number(e.target.value);
              setLength(n);
              newMelody(n);
            }}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            {LENGTHS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-muted-foreground">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      {/* Answer slots */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: melody.length }, (_, i) => {
          const filled = answer[i];
          const state = checked ? (checked[i] ? 'correct' : 'wrong') : 'idle';
          return (
            <div
              key={`slot-${i}`}
              className={`flex h-12 w-14 items-center justify-center rounded-md border text-sm font-semibold ${
                state === 'correct'
                  ? 'border-green-600 bg-green-600/15'
                  : state === 'wrong'
                    ? 'border-red-600 bg-red-600/15'
                    : 'border-border'
              }`}
            >
              {filled ?? '·'}
            </div>
          );
        })}
      </div>

      {/* Note palette */}
      <div className="flex flex-wrap gap-2" data-help="staves">
        {POOL.map((n) => (
          <button
            key={n.name}
            type="button"
            onClick={() => pick(n.name)}
            disabled={!!checked || answer.length >= melody.length}
            className="w-14 rounded-md border border-border py-2 text-sm font-medium hover:bg-muted disabled:opacity-40"
          >
            {n.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAnswer((a) => a.slice(0, -1))}
          disabled={!!checked || answer.length === 0}
          className="rounded-md border border-border px-3 py-1 text-sm disabled:opacity-40"
        >
          ← Backspace
        </button>
        <button
          type="button"
          onClick={check}
          disabled={!!checked || answer.length !== melody.length}
          className="rounded-md bg-primary px-4 py-1 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          Check
        </button>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-md border border-border px-3 py-1 text-sm"
        >
          Reveal
        </button>
        <button
          type="button"
          onClick={() => newMelody()}
          className="rounded-md border border-border px-3 py-1 text-sm"
        >
          ↻ New melody
        </button>
      </div>

      {checked ? (
        <p
          className={`text-sm font-medium ${checked.every(Boolean) ? 'text-green-600' : 'text-red-600'}`}
        >
          {checked.every(Boolean) ? '✓ Perfect!' : 'Some notes were off — reveal to compare.'}
        </p>
      ) : null}

      {revealed ? <StaffSequence notes={melody} showLabels /> : null}

      <p className="text-xs text-muted-foreground">
        Listen, then rebuild the melody (C major) note by note from the palette and Check yourself.
      </p>
    </div>
  );
}
