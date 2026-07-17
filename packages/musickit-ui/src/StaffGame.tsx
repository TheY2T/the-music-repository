import { playTone } from '@TheY2T/tmr-music-core/audio';
import {
  bassStaffNotes,
  type Level,
  ledgerSteps,
  midiToFrequency,
  trebleStaffNotes,
} from '@TheY2T/tmr-music-core/music-theory';
import { useLevel } from '@TheY2T/tmr-music-core/use-level';
import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import LevelToggle from './LevelToggle';

const BASE_Y = 116;
const HALF = 8;
const STAFF_LINE_STEPS = [0, 2, 4, 6, 8];
const NOTE_X = 150;
const stepY = (step: number) => BASE_Y - step * HALF;
const ROUND_SECONDS = 60;
const BEST_KEY = 'tmr.staffGame.best';
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

type Clef = 'treble' | 'bass';
interface GameNote {
  name: string;
  step: number;
  midi: number;
  clef: Clef;
}

const CLEF_GLYPH: Record<Clef, { glyph: string; glyphStep: number }> = {
  treble: { glyph: '𝄞', glyphStep: 2 },
  bass: { glyph: '𝄢', glyphStep: 6 },
};

// Beginner reads treble only; intermediate+ mixes both clefs so you learn to read either.
function poolFor(level: Level): GameNote[] {
  const treble = trebleStaffNotes().map((n) => ({ ...n, clef: 'treble' as Clef }));
  if (level === 'beginner') return treble;
  const bass = bassStaffNotes().map((n) => ({ ...n, clef: 'bass' as Clef }));
  return [...treble, ...bass];
}

function pickNote(pool: GameNote[], not: string | null): GameNote {
  const candidates = pool.filter((n) => n.name !== not);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

export default function StaffGame() {
  const { level, setLevel } = useLevel();
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [note, setNote] = useState<GameNote | null>(null);
  const [flash, setFlash] = useState<'ok' | 'wrong' | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setNote(pickNote(poolFor(level), null));
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

  function answer(letter: string) {
    if (!running || !note) return;
    playTone(midiToFrequency(note.midi));
    const correct = note.name[0] === letter;
    setFlash(correct ? 'ok' : 'wrong');
    window.setTimeout(() => setFlash(null), 300);
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setNote((prev) => pickNote(poolFor(level), prev?.name ?? null));
    } else {
      setStreak(0);
    }
  }

  const clef = note ? CLEF_GLYPH[note.clef] : CLEF_GLYPH.treble;

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
          'flex justify-center rounded-lg border p-4',
          flash === 'ok'
            ? 'border-success bg-success/10'
            : flash === 'wrong'
              ? 'border-destructive bg-destructive/10'
              : 'border-border bg-muted',
        )}
      >
        <svg viewBox="0 0 220 150" className="w-64" role="img" aria-label="Note on the staff">
          {STAFF_LINE_STEPS.map((s) => (
            <line
              key={s}
              x1={16}
              x2={204}
              y1={stepY(s)}
              y2={stepY(s)}
              className="stroke-foreground"
              strokeWidth={1.5}
            />
          ))}
          <text x={20} y={stepY(clef.glyphStep) + 20} className="fill-foreground" fontSize={64}>
            {clef.glyph}
          </text>
          {running && note ? (
            <>
              {ledgerSteps(note.step).map((ledger) => (
                <line
                  key={ledger}
                  x1={NOTE_X - 12}
                  x2={NOTE_X + 12}
                  y1={stepY(ledger)}
                  y2={stepY(ledger)}
                  className="stroke-foreground"
                  strokeWidth={1.5}
                />
              ))}
              <ellipse
                cx={NOTE_X}
                cy={stepY(note.step)}
                rx={8}
                ry={6}
                className="fill-foreground"
              />
            </>
          ) : null}
        </svg>
      </div>

      {!running && timeLeft === 0 ? (
        <p className="text-center text-lg font-semibold">Time! You read {score} notes.</p>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          {running
            ? 'Name the note on the staff.'
            : 'Read the note and tap its letter before time runs out. Beginner is treble clef; raise the level to add the bass clef.'}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            disabled={!running}
            onClick={() => answer(letter)}
            className={cn(
              'h-12 w-12 rounded-lg border border-border text-lg font-semibold transition-colors',
              running ? 'hover:bg-accent/30' : 'opacity-50',
            )}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
}
