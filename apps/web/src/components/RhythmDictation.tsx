import { Button, Card, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import StaffSequence, { type StaffNoteDatum } from '@/components/StaffSequence';
import { getAudioContext, playTone, scheduleClick } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

const DURATIONS = [
  { beats: 0.5, glyph: '♪', label: 'eighth' },
  { beats: 1, glyph: '♩', label: 'quarter' },
  { beats: 1.5, glyph: '♩.', label: 'dotted' },
  { beats: 2, glyph: '𝅗𝅥', label: 'half' },
];

/** Generate one bar of 4/4 by drawing durations that fit the remaining space. */
function generateBar(): number[] {
  const beats: number[] = [];
  let remaining = 4;
  while (remaining > 0) {
    const options = DURATIONS.map((d) => d.beats).filter((b) => b <= remaining);
    beats.push(options[Math.floor(Math.random() * options.length)]);
    remaining = Math.round((remaining - beats[beats.length - 1]) * 2) / 2;
  }
  return beats;
}

const toNotes = (beats: number[]): StaffNoteDatum[] =>
  beats.map((b) => ({ step: 4, label: '', beats: b }));

export default function RhythmDictation() {
  const [target, setTarget] = useState<number[]>(() => generateBar());
  const [answer, setAnswer] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const noteTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const answerTotal = answer.reduce((a, b) => a + b, 0);

  function playTarget() {
    window.clearTimeout(noteTimer.current);
    const bpm = 90;
    let i = 0;
    let beatAcc = 0;
    const ctx = getAudioContext();
    if (ctx) {
      // A steady quarter-note click for the pulse.
      for (let beat = 0; beat < 4; beat += 1) {
        scheduleClick(ctx.currentTime + 0.05 + beat * (60 / bpm), beat === 0);
      }
    }
    const step = () => {
      if (i >= target.length) {
        return;
      }
      playTone(midiToFrequency(84), 0.09); // woodblock per note
      const dur = target[i];
      beatAcc += dur;
      i += 1;
      noteTimer.current = window.setTimeout(step, dur * (60 / 90) * 1000);
    };
    step();
    void beatAcc;
  }

  function add(beats: number) {
    if (checked !== null || answerTotal + beats > 4) {
      return;
    }
    playTone(midiToFrequency(84), 0.09);
    setAnswer((a) => [...a, beats]);
  }

  function check() {
    const correct = answer.length === target.length && answer.every((b, i) => b === target[i]);
    setChecked(correct);
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function reset() {
    setTarget(generateBar());
    setAnswer([]);
    setChecked(null);
    setRevealed(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={playTarget}>
          <Icon name="play" className="size-4" />
          Play rhythm
        </Button>
        <span className="text-sm text-muted-foreground">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <Card className="flex min-h-[3rem] flex-wrap items-center gap-2 p-3">
        {answer.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Tap durations to build one bar (4 beats)…
          </span>
        ) : (
          answer.map((b, i) => (
            <span key={`a-${i}`} className="rounded bg-muted px-2 py-1 font-mono text-sm">
              {DURATIONS.find((d) => d.beats === b)?.glyph}
            </span>
          ))
        )}
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {answerTotal} / 4
        </span>
      </Card>

      <div className="flex flex-wrap gap-2" data-help="rhythm">
        {DURATIONS.map((d) => (
          <Button
            key={d.label}
            type="button"
            variant="outline"
            className="text-lg"
            onClick={() => add(d.beats)}
            disabled={checked !== null || answerTotal + d.beats > 4}
            title={d.label}
          >
            {d.glyph}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAnswer((a) => a.slice(0, -1))}
          disabled={checked !== null || answer.length === 0}
        >
          <Icon name="arrow-left" className="size-4" />
          Backspace
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={check}
          disabled={checked !== null || answerTotal !== 4}
        >
          Check
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRevealed(true)}>
          Reveal
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          <Icon name="refresh" className="size-4" />
          New rhythm
        </Button>
      </div>

      {checked !== null ? (
        <p className={`text-sm font-medium ${checked ? 'text-green-600' : 'text-red-600'}`}>
          {checked ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="check" className="size-4" />
              Correct rhythm!
            </span>
          ) : (
            'Not quite — reveal to compare.'
          )}
        </p>
      ) : null}

      {revealed ? <StaffSequence notes={toNotes(target)} /> : null}

      <p className="text-xs text-muted-foreground">
        Listen to the one-bar rhythm, then rebuild it from the note values (♪ eighth · ♩ quarter ·
        ♩. dotted · 𝅗𝅥 half) and Check.
      </p>
    </div>
  );
}
