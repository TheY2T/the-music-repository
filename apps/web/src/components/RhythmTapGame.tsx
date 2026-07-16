import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import LevelToggle from '@/components/LevelToggle';
import { getAudioContext, scheduleClick, scheduleDrum } from '@/lib/audio';
import type { Level } from '@/lib/music-theory';
import { useLevel } from '@/lib/use-level';

const SLOTS = 8; // eighth-note slots per 4/4 bar
const BPM = 90;
const BEAT = 60 / BPM;
const EIGHTH = BEAT / 2;
const BAR = 4 * BEAT;
const LEAD = 0.18; // seconds before the first click

// Timing windows (seconds) for rating a tap against its target.
const PERFECT = 0.05;
const GOOD = 0.13;
const WINDOW = 0.2; // max distance a tap can be from a target to count at all

type Rating = 'perfect' | 'good' | 'miss';

/** Random one-bar rhythm as booleans over 8 eighth slots. Beat 1 always sounds; density/syncopation
 * grow with level (beginner = on-beats only; higher = off-beats too). */
function generatePattern(level: Level): boolean[] {
  const beatsOnly = level === 'beginner';
  const offBeatChance = level === 'intermediate' ? 0.4 : level === 'advanced' ? 0.6 : 0.75;
  const onBeatChance = beatsOnly ? 0.7 : 0.85;
  const pattern = Array.from({ length: SLOTS }, (_, i) => {
    if (i === 0) return true; // downbeat
    const onBeat = i % 2 === 0;
    if (onBeat) return Math.random() < onBeatChance;
    return beatsOnly ? false : Math.random() < offBeatChance;
  });
  return pattern;
}

interface Target {
  time: number;
  consumed: boolean;
  rating: Rating | null;
}

export default function RhythmTapGame() {
  const { level, setLevel } = useLevel();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'countin' | 'tap' | 'result'>('idle');
  // Deterministic initial pattern (quarter notes) so SSR and client match; randomised on Start.
  const [pattern, setPattern] = useState<boolean[]>(() => [
    true,
    false,
    true,
    false,
    true,
    false,
    true,
    false,
  ]);
  const [playhead, setPlayhead] = useState(-1);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [score, setScore] = useState({ perfect: 0, good: 0, miss: 0 });
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const targetsRef = useRef<Map<number, Target>>(new Map()); // slot → target
  const tapBarStartRef = useRef(0);
  const runningRef = useRef(false);
  const timeouts = useRef<number[]>([]);
  const raf = useRef<number | null>(null);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    const saved = Number(localStorage.getItem('tmr.rhythmGame.best') ?? '0');
    if (Number.isFinite(saved)) setBest(saved);
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timeouts.current) clearTimeout(id);
    timeouts.current = [];
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setPhase('idle');
    setPlayhead(-1);
    clearTimers();
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // Run one round: count-in bar, then a tap bar scored against the pattern; auto-advance while running.
  const runRound = useCallback(
    (ctx: AudioContext) => {
      const pat = generatePattern(levelRef.current);
      setPattern(pat);
      setRatings({});
      setPhase('countin');

      const t0 = ctx.currentTime + LEAD;
      const tapBarStart = t0 + BAR;
      tapBarStartRef.current = tapBarStart;

      // Count-in + tap-bar metronome clicks (accent on the downbeat).
      for (let i = 0; i < 4; i += 1) {
        scheduleClick(t0 + i * BEAT, i === 0);
        scheduleClick(tapBarStart + i * BEAT, i === 0);
      }

      // Targets = the pattern's hit slots in the tap bar; sound a woodblock so the player hears the goal.
      const targets = new Map<number, Target>();
      pat.forEach((hit, slot) => {
        if (hit) {
          const time = tapBarStart + slot * EIGHTH;
          targets.set(slot, { time, consumed: false, rating: null });
          scheduleClick(time, false); // reference tick on each target
        }
      });
      targetsRef.current = targets;

      const ms = (t: number) => Math.max(0, (t - ctx.currentTime) * 1000);
      timeouts.current.push(window.setTimeout(() => setPhase('tap'), ms(tapBarStart)));

      // Playhead animation during the tap bar.
      const animate = () => {
        const pos = (ctx.currentTime - tapBarStart) / EIGHTH;
        setPlayhead(pos >= 0 && pos < SLOTS ? Math.floor(pos) : -1);
        if (runningRef.current) raf.current = requestAnimationFrame(animate);
      };
      raf.current = requestAnimationFrame(animate);

      // Evaluate shortly after the tap bar ends (grace for late taps).
      timeouts.current.push(
        window.setTimeout(
          () => {
            const result: Record<number, Rating> = {};
            const round = { perfect: 0, good: 0, miss: 0 };
            for (const [slot, tgt] of targetsRef.current) {
              const rating = tgt.rating ?? 'miss';
              result[slot] = rating;
              round[rating] += 1;
            }
            setRatings(result);
            setScore((s) => ({
              perfect: s.perfect + round.perfect,
              good: s.good + round.good,
              miss: s.miss + round.miss,
            }));
            const clean = round.miss === 0;
            setStreak((st) => {
              const next = clean ? st + 1 : 0;
              if (next > best) {
                setBest(next);
                try {
                  localStorage.setItem('tmr.rhythmGame.best', String(next));
                } catch {
                  // storage disabled
                }
              }
              return next;
            });
            setPhase('result');
            setPlayhead(-1);
            if (runningRef.current) {
              timeouts.current.push(window.setTimeout(() => runRound(ctx), 900));
            }
          },
          ms(tapBarStart + BAR + WINDOW),
        ),
      );
    },
    [best],
  );

  const start = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    void ctx.resume();
    setScore({ perfect: 0, good: 0, miss: 0 });
    setStreak(0);
    runningRef.current = true;
    setRunning(true);
    clearTimers();
    runRound(ctx);
  }, [clearTimers, runRound]);

  // Rate a tap against the nearest unconsumed target.
  const tap = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx || !runningRef.current) return;
    scheduleDrum('kick', ctx.currentTime);
    const now = ctx.currentTime;
    let nearest: Target | null = null;
    let nearestSlot = -1;
    let bestErr = WINDOW;
    for (const [slot, tgt] of targetsRef.current) {
      if (tgt.consumed) continue;
      const err = Math.abs(now - tgt.time);
      if (err < bestErr) {
        bestErr = err;
        nearest = tgt;
        nearestSlot = slot;
      }
    }
    if (!nearest) return;
    nearest.consumed = true;
    nearest.rating = bestErr < PERFECT ? 'perfect' : bestErr < GOOD ? 'good' : 'miss';
    const captured = nearest.rating;
    setRatings((r) => ({ ...r, [nearestSlot]: captured }));
  }, []);

  // Spacebar taps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && runningRef.current) {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);

  const accuracy =
    score.perfect + score.good + score.miss > 0
      ? Math.round(((score.perfect + score.good) / (score.perfect + score.good + score.miss)) * 100)
      : 0;

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
            Start
          </Button>
        )}
        <LevelToggle level={level} onChange={setLevel} />
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span>
            Accuracy <span className="font-mono font-semibold text-foreground">{accuracy}%</span>
          </span>
          <span>
            Streak <span className="font-mono font-semibold text-foreground">{streak}</span>
          </span>
          <span className="text-muted-foreground">
            Best <span className="font-mono">{best}</span>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted p-4">
        <div className="mb-3 text-center text-sm text-muted-foreground">
          {phase === 'countin'
            ? 'Listen — count in…'
            : phase === 'tap'
              ? 'Tap the rhythm!'
              : phase === 'result'
                ? 'Round scored — next one coming…'
                : 'Hear a one-bar rhythm, then tap it back on the beat. Use the Tap button or the spacebar.'}
        </div>
        <div className="flex justify-center gap-1.5">
          {pattern.map((hit, slot) => {
            const rating = ratings[slot];
            return (
              <div
                key={`slot-${slot}`}
                className={cn(
                  'h-12 w-9 rounded-md border transition-colors',
                  slot % 2 === 0 ? 'border-border' : 'border-border/50',
                  playhead === slot && 'ring-2 ring-ring',
                  rating === 'perfect'
                    ? 'border-success bg-success'
                    : rating === 'good'
                      ? 'border-warning bg-warning/70'
                      : rating === 'miss'
                        ? 'border-destructive bg-destructive/40'
                        : hit
                          ? 'bg-primary/70'
                          : 'bg-transparent',
                )}
              />
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!running}
        onPointerDown={tap}
        className={cn(
          'h-24 w-full rounded-xl border-2 text-lg font-semibold transition-colors',
          running
            ? 'border-primary bg-primary/10 text-foreground active:bg-primary/30'
            : 'border-border text-muted-foreground opacity-60',
        )}
      >
        Tap
      </button>

      <p className="text-xs text-muted-foreground">
        Green = spot on, amber = close, red = missed. Clear a whole bar (no misses) to build your
        streak. Raise the level for busier, more syncopated rhythms.
      </p>
    </div>
  );
}
