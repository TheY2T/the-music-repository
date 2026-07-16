import type { Locale } from '@TheY2T/tmr-i18n';
import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useState } from 'react';
import InstrumentLoading from '@/components/InstrumentLoading';
import AlphaTexScore from '@/components/score/AlphaTexScore';
import { trebleStaffNotes } from '@/lib/music-theory';
import { melodyToAlphaTex } from '@/lib/score/alphatex';
import { playNote } from '@/lib/soundfont';
import { useInstrumentReady } from '@/lib/use-instrument-ready';

// One-octave pool C4–C5 so the answer palette covers every note the generator can pick.
const POOL = trebleStaffNotes().filter((n) => n.midi >= 60 && n.midi <= 72);

interface DictNote {
  step: number;
  label: string;
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

export default function MelodicDictation({ locale }: { locale: Locale }) {
  const [length, setLength] = useState(4);
  const [melody, setMelody] = useState<DictNote[]>(() => generate(4));
  const [answer, setAnswer] = useState<string[]>([]);
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function play() {
    melody.forEach((n, i) => {
      window.setTimeout(() => playNote(n.midi, 0.5), i * 550);
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
      playNote(note.midi, 0.4);
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

  const { ready } = useInstrumentReady();
  if (!ready) return <InstrumentLoading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={play}>
          <Icon name="play" className="size-4" />
          Play melody
        </Button>
        <label className="flex items-center gap-2 text-sm">
          Notes
          <Select
            value={length}
            onChange={(e) => {
              const n = Number(e.target.value);
              setLength(n);
              newMelody(n);
            }}
            className="h-auto w-auto px-2 py-1"
          >
            {LENGTHS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAnswer((a) => a.slice(0, -1))}
          disabled={!!checked || answer.length === 0}
        >
          <Icon name="arrow-left" className="size-4" />
          Backspace
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={check}
          disabled={!!checked || answer.length !== melody.length}
        >
          Check
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRevealed(true)}>
          Reveal
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => newMelody()}>
          <Icon name="refresh" className="size-4" />
          New melody
        </Button>
      </div>

      {checked ? (
        <p
          className={`text-sm font-medium ${checked.every(Boolean) ? 'text-green-600' : 'text-red-600'}`}
        >
          {checked.every(Boolean) ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="check" className="size-4" />
              Perfect!
            </span>
          ) : (
            'Some notes were off — reveal to compare.'
          )}
        </p>
      ) : null}

      {revealed ? (
        <AlphaTexScore
          tex={melodyToAlphaTex(
            melody.map((n) => ({ name: n.label, beats: 1 })),
            { title: 'Melody', lyrics: melody.map((n) => n.label) },
          )}
          mode="standard"
          locale={locale}
          showPlay={false}
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        Listen, then rebuild the melody (C major) note by note from the palette and Check yourself.
      </p>
    </div>
  );
}
