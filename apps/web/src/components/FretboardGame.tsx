import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import LevelToggle from '@/components/LevelToggle';
import { playTone } from '@/lib/audio';
import {
  midiToFrequency,
  pitchName,
  STANDARD_TUNING,
  STANDARD_TUNING_NAMES,
} from '@/lib/music-theory';
import { useLevel } from '@/lib/use-level';

const FRET_COUNT = 12;
const frets = Array.from({ length: FRET_COUNT + 1 }, (_, f) => f);
const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11];
const ROUND_SECONDS = 60;
const BEST_KEY = 'tmr.fretGame.best';

// Beginner: naturals only + fret note-names shown (learning). Higher levels: all 12 notes, names hidden.
function targetPoolFor(level: string): number[] {
  return level === 'beginner' ? NATURAL_PCS : Array.from({ length: 12 }, (_, i) => i);
}

function pickTarget(pool: number[], not: number | null): number {
  // Exclude the previous target so the same note doesn't repeat back-to-back.
  const candidates = pool.filter((pc) => pc !== not);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

export default function FretboardGame() {
  const { level, setLevel } = useLevel();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [target, setTarget] = useState<number>(0);
  const [flash, setFlash] = useState<{ midi: number; ok: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const showNames = level === 'beginner';

  useEffect(() => {
    const saved = Number(localStorage.getItem(BEST_KEY) ?? '0');
    if (Number.isFinite(saved)) setBest(saved);
  }, []);

  const stop = useCallback(() => {
    setRunning(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setScore((finalScore) => {
      setBest((b) => {
        if (finalScore > b) {
          try {
            localStorage.setItem(BEST_KEY, String(finalScore));
          } catch {
            // storage disabled — keep the in-memory best
          }
          return finalScore;
        }
        return b;
      });
      return finalScore;
    });
  }, []);

  function start() {
    setScore(0);
    setStreak(0);
    setTimeLeft(ROUND_SECONDS);
    setTarget(pickTarget(targetPoolFor(level), null));
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

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function guess(midi: number) {
    if (!running) return;
    playTone(midiToFrequency(midi));
    const correct = midi % 12 === target;
    setFlash({ midi, ok: correct });
    window.setTimeout(() => setFlash(null), 300);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setTarget((prev) => pickTarget(targetPoolFor(level), prev));
    } else {
      setStreak(0);
    }
  }

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

      <div
        className={cn(
          'rounded-lg border border-border p-3 text-center',
          running ? 'bg-accent/10' : 'bg-muted',
        )}
      >
        {running ? (
          <p className="text-lg">
            Find <span className="text-2xl font-bold text-foreground">{pitchName(target)}</span> —
            tap every string.
          </p>
        ) : timeLeft === 0 ? (
          <p className="text-lg font-semibold">Time! You found {score} notes.</p>
        ) : (
          <p className="text-muted-foreground">
            Tap the fret for the named note before time runs out. Beginner shows note names; raise
            the level to hide them and include sharps.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-[11px]">
          <thead>
            <tr>
              <th className="w-6" />
              {frets.map((f) => (
                <th key={f} className="pb-1 font-normal text-muted-foreground">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STANDARD_TUNING.map((open, stringIndex) => (
              <tr key={`${STANDARD_TUNING_NAMES[stringIndex]}-${open}`}>
                <th className="pr-1 text-right font-mono text-muted-foreground">
                  {STANDARD_TUNING_NAMES[stringIndex]}
                </th>
                {frets.map((f) => {
                  const midi = open + f;
                  const isFlash = flash?.midi === midi;
                  return (
                    <td key={f} className="h-8 border border-border p-0">
                      <button
                        type="button"
                        aria-label={`${pitchName(midi % 12)} — string ${STANDARD_TUNING_NAMES[stringIndex]}, fret ${f}`}
                        disabled={!running}
                        onClick={() => guess(midi)}
                        className={cn(
                          'flex h-full w-full items-center justify-center transition-colors',
                          isFlash
                            ? flash?.ok
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                            : running
                              ? 'hover:bg-accent/30'
                              : '',
                        )}
                      >
                        {showNames ? pitchName(midi % 12) : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        A 60-second note-finding sprint on the guitar neck. Every correct fret (any string) scores
        and builds your streak; your best score is saved on this device.
      </p>
    </div>
  );
}
