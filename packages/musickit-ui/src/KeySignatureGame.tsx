import { playTone } from '@TheY2T/tmr-music-core/audio';
import { CIRCLE_OF_FIFTHS, type Level, midiToFrequency } from '@TheY2T/tmr-music-core/music-theory';
import { useLevel } from '@TheY2T/tmr-music-core/use-level';
import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import LevelToggle from './LevelToggle';

const BASE_Y = 70;
const HALF = 7;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];
const stepY = (step: number) => BASE_Y - step * HALF;
const ROUND_SECONDS = 60;
const BEST_KEY = 'tmr.keySigGame.best';

// Treble-clef staff steps (E4 = 0) for each accidental, in the order they're written.
const SHARP_STEPS = [8, 5, 9, 6, 3, 7, 4]; // F♯ C♯ G♯ D♯ A♯ E♯ B♯
const FLAT_STEPS = [4, 7, 3, 6, 2, 5, 1]; // B♭ E♭ A♭ D♭ G♭ C♭ F♭

// Beginner: keys up to 2 accidentals; higher levels widen toward all 12.
function poolFor(level: Level) {
  const max = level === 'beginner' ? 2 : level === 'intermediate' ? 4 : 7;
  return CIRCLE_OF_FIFTHS.filter((e) => Math.abs(e.accidentals) <= max);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Entry = (typeof CIRCLE_OF_FIFTHS)[number];

function makeRound(level: Level): { target: Entry; options: Entry[] } {
  const pool = poolFor(level);
  const target = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffle(CIRCLE_OF_FIFTHS.filter((e) => e.major !== target.major)).slice(0, 3);
  return { target, options: shuffle([target, ...distractors]) };
}

export default function KeySignatureGame() {
  const { level, setLevel } = useLevel();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [round, setRound] = useState(() => makeRound('beginner'));
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) ?? '0');
    if (Number.isFinite(saved)) setBest(saved);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setScore((final) => {
      setBest((b) => {
        if (final > b) {
          try {
            localStorage.setItem(BEST_KEY, String(final));
          } catch {
            // storage disabled
          }
          return final;
        }
        return b;
      });
      return final;
    });
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  function start() {
    setScore(0);
    setStreak(0);
    setTimeLeft(ROUND_SECONDS);
    setRound(makeRound(levelRef.current));
    setRunning(true);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stop();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function answer(entry: Entry) {
    if (!running) return;
    const correct = entry.major === round.target.major;
    playTone(midiToFrequency(60 + round.target.pitchClass), 0.6);
    setFlash(correct ? 'ok' : entry.major);
    window.setTimeout(() => setFlash(null), 300);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setRound(makeRound(levelRef.current));
    } else {
      setStreak(0);
    }
  }

  const { target } = round;
  const count = Math.abs(target.accidentals);
  const isSharp = target.accidentals > 0;
  const steps = (isSharp ? SHARP_STEPS : FLAT_STEPS).slice(0, count);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {running ? (
          <Button type="button" variant="outline" onClick={stop}>
            <Icon name="square" className="size-4" />
            Stop
          </Button>
        ) : (
          <Button type="button" onClick={start}>
            <Icon name="play" className="size-4" />
            {score > 0 || timeLeft === 0 ? 'Play again' : 'Start'}
          </Button>
        )}
        <LevelToggle level={level} onChange={setLevel} />
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span>
            Time <span className="font-mono font-semibold text-foreground">{timeLeft}s</span>
          </span>
          <span>
            Score <span className="font-mono font-semibold text-foreground">{score}</span>
          </span>
          <span>
            Streak <span className="font-mono font-semibold text-foreground">{streak}</span>
          </span>
          <span className="text-muted-foreground">
            Best <span className="font-mono">{best}</span>
          </span>
        </div>
      </div>

      <div className="flex justify-center rounded-lg border border-border bg-muted p-4">
        <svg viewBox="0 0 200 100" className="w-64" role="img" aria-label="Key signature">
          {STAFF_LINE_STEPS.map((s) => (
            <line
              key={s}
              x1={16}
              x2={184}
              y1={stepY(s)}
              y2={stepY(s)}
              className="stroke-foreground"
              strokeWidth={1.3}
            />
          ))}
          <text x={18} y={stepY(2) + 16} className="fill-foreground" fontSize={52}>
            𝄞
          </text>
          {running
            ? steps.map((step, i) => (
                <text
                  key={`${step}-${i}`}
                  x={82 + i * 13}
                  y={stepY(step) + 6}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={22}
                >
                  {isSharp ? '♯' : '♭'}
                </text>
              ))
            : null}
          {running && count === 0 ? (
            <text
              x={120}
              y={stepY(4) + 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              (no sharps or flats)
            </text>
          ) : null}
        </svg>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {running
          ? 'Which major key has this signature?'
          : timeLeft === 0
            ? `Time! You named ${score} keys.`
            : 'Read the sharps or flats and name the major key before time runs out. Beginner keeps to ±2 accidentals.'}
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {round.options.map((opt) => (
          <button
            key={opt.major}
            type="button"
            disabled={!running}
            onClick={() => answer(opt)}
            className={cn(
              'rounded-lg border border-border py-3 text-lg font-semibold transition-colors',
              flash === 'ok' &&
                opt.major === round.target.major &&
                'border-success bg-success text-success-foreground',
              flash === opt.major &&
                'border-destructive bg-destructive text-destructive-foreground',
              running ? 'hover:bg-accent/30' : 'opacity-50',
            )}
          >
            {opt.major} major
          </button>
        ))}
      </div>
    </div>
  );
}
