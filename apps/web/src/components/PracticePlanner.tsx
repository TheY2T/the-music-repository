import { Button, Icon, Select } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playTone } from '@/lib/audio';
import { midiToFrequency } from '@/lib/music-theory';

const STORAGE_KEY = 'tmr.practiceRoutine';

interface Block {
  id: number;
  label: string;
  minutes: number;
  href?: string;
}

// Preset practice blocks, each pointing at the tool (or the catalogue) that supports it.
const PRESETS: { label: string; minutes: number; href?: string }[] = [
  { label: 'Warm up — scales', minutes: 5, href: '/tools/speed-trainer' },
  { label: 'Technique drill', minutes: 5, href: '/tools/fret-game' },
  { label: 'Sight-reading', minutes: 10, href: '/tools/sight-reading' },
  { label: 'Note reading', minutes: 5, href: '/tools/staff-game' },
  { label: 'Chords & progressions', minutes: 10, href: '/tools/progression-generator' },
  { label: 'Voice leading', minutes: 5, href: '/tools/voice-leading' },
  { label: 'Ear training', minutes: 5, href: '/tools/ear-trainer' },
  { label: 'Rhythm', minutes: 5, href: '/tools/rhythm-game' },
  { label: 'Improvise', minutes: 10, href: '/tools/improvise' },
  { label: 'Repertoire', minutes: 15, href: '/catalogue' },
  { label: 'Free practice', minutes: 10 },
];

const DEFAULT_ROUTINE: Omit<Block, 'id'>[] = [
  { label: 'Warm up — scales', minutes: 5, href: '/tools/speed-trainer' },
  { label: 'Sight-reading', minutes: 10, href: '/tools/sight-reading' },
  { label: 'Chords & progressions', minutes: 10, href: '/tools/progression-generator' },
  { label: 'Repertoire', minutes: 15, href: '/catalogue' },
  { label: 'Ear training', minutes: 5, href: '/tools/ear-trainer' },
];

const fmt = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

export default function PracticePlanner() {
  const idRef = useRef(1);
  const nextId = () => idRef.current++;
  const [blocks, setBlocks] = useState<Block[]>(() =>
    DEFAULT_ROUTINE.map((b) => ({ ...b, id: nextId() })),
  );
  const [presetKey, setPresetKey] = useState('0');

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Load a saved routine after mount (SSR-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Omit<Block, 'id'>[];
        if (Array.isArray(saved) && saved.length) {
          setBlocks(saved.map((b) => ({ ...b, id: nextId() })));
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const persist = useCallback((next: Block[]) => {
    try {
      const routine = next.map((b) => ({ label: b.label, minutes: b.minutes, href: b.href }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routine));
    } catch {
      // ignore
    }
  }, []);

  const update = useCallback(
    (next: Block[]) => {
      setBlocks(next);
      persist(next);
    },
    [persist],
  );

  const clearTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => () => clearTimer(), []);

  const totalMin = blocks.reduce((s, b) => s + b.minutes, 0);

  function chime() {
    playTone(midiToFrequency(76), 0.25);
    window.setTimeout(() => playTone(midiToFrequency(83), 0.4), 180);
  }

  // Move to the next block (chiming), or finish the session after the last one.
  const advance = useCallback(() => {
    chime();
    setCurrent((idx) => {
      const next = idx + 1;
      if (next < blocksRef.current.length) {
        setSecondsLeft(blocksRef.current[next].minutes * 60);
        return next;
      }
      clearTimer();
      setRunning(false);
      setDone(true);
      return idx;
    });
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft((s) => {
      if (s > 1) return s - 1;
      advance();
      return 0;
    });
  }, [advance]);

  function startSession() {
    if (!blocks.length) return;
    setCurrent(0);
    setSecondsLeft(blocks[0].minutes * 60);
    setRunning(true);
    setPaused(false);
    setDone(false);
    clearTimer();
    timer.current = setInterval(tick, 1000);
  }

  function togglePause() {
    if (paused) {
      timer.current = setInterval(tick, 1000);
      setPaused(false);
    } else {
      clearTimer();
      setPaused(true);
    }
  }

  function skip() {
    advance();
  }

  function stopSession() {
    clearTimer();
    setRunning(false);
    setPaused(false);
    setDone(false);
  }

  // ---- Build-phase editing ----
  function addPreset() {
    const p = PRESETS[Number(presetKey)] ?? PRESETS[0];
    update([...blocks, { ...p, id: nextId() }]);
  }
  function remove(id: number) {
    update(blocks.filter((b) => b.id !== id));
  }
  function move(id: number, dir: -1 | 1) {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  }
  function setMinutes(id: number, minutes: number) {
    update(
      blocks.map((b) => (b.id === id ? { ...b, minutes: Math.max(1, Math.min(120, minutes)) } : b)),
    );
  }
  function setLabel(id: number, label: string) {
    update(blocks.map((b) => (b.id === id ? { ...b, label } : b)));
  }

  if (running || done) {
    const block = blocks[current];
    return (
      <div className="space-y-5">
        {done ? (
          <div className="rounded-lg border border-emerald-500 bg-emerald-500/10 p-6 text-center">
            <Icon
              name="party-popper"
              className="mx-auto size-8 text-emerald-600 dark:text-emerald-400"
            />
            <p className="mt-2 text-lg font-semibold">Session complete — {totalMin} minutes!</p>
            <p className="text-sm text-muted-foreground">
              Nice work. Your practice time is logged to your progress.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted p-6 text-center">
            <div className="text-sm text-muted-foreground">
              Block {current + 1} of {blocks.length}
            </div>
            <h2 className="mt-1 text-2xl font-bold">{block.label}</h2>
            <div className="my-3 font-mono text-6xl font-bold tabular-nums">{fmt(secondsLeft)}</div>
            {block.href ? (
              <a
                href={block.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                Open the tool for this block →
              </a>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <>
              <Button type="button" variant="outline" onClick={togglePause}>
                <Icon name={paused ? 'play' : 'square'} className="size-4" />
                {paused ? 'Resume' : 'Pause'}
              </Button>
              <Button type="button" variant="outline" onClick={skip}>
                Next block
                <Icon name="arrow-right" className="size-4" />
              </Button>
              <Button type="button" variant="ghost" onClick={stopSession}>
                End session
              </Button>
            </>
          ) : (
            <Button type="button" onClick={stopSession}>
              Back to plan
            </Button>
          )}
        </div>

        <ol className="space-y-1 text-sm">
          {blocks.map((b, i) => (
            <li
              key={b.id}
              className={`flex justify-between rounded-md px-3 py-2 ${i === current && running ? 'bg-accent/20 font-medium' : i < current || done ? 'text-muted-foreground line-through' : ''}`}
            >
              <span>{b.label}</span>
              <span className="font-mono">{b.minutes} min</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-2">
        {blocks.map((b, i) => (
          <li key={b.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
            <div className="flex flex-col">
              <button
                type="button"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => move(b.id, -1)}
                className="text-muted-foreground disabled:opacity-30"
              >
                <Icon name="chevron-up" className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={i === blocks.length - 1}
                onClick={() => move(b.id, 1)}
                className="text-muted-foreground disabled:opacity-30"
              >
                <Icon name="chevron-down" className="size-4" />
              </button>
            </div>
            <input
              value={b.label}
              onChange={(e) => setLabel(b.id, e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
              aria-label="Activity"
            />
            <input
              type="number"
              value={b.minutes}
              min={1}
              max={120}
              onChange={(e) => setMinutes(b.id, Number(e.target.value))}
              className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm"
              aria-label="Minutes"
            />
            <span className="text-xs text-muted-foreground">min</span>
            {b.href ? (
              <a
                href={b.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Open tool"
              >
                <Icon name="external-link" className="size-4" />
              </a>
            ) : (
              <span className="size-4" />
            )}
            <button
              type="button"
              aria-label="Remove"
              onClick={() => remove(b.id)}
              className="text-muted-foreground hover:text-red-500"
            >
              <Icon name="x" className="size-4" />
            </button>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={presetKey}
          onChange={(e) => setPresetKey(e.target.value)}
          className="h-auto w-auto px-2 py-1"
        >
          {PRESETS.map((p, i) => (
            <option key={p.label} value={i}>
              {p.label} ({p.minutes} min)
            </option>
          ))}
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={addPreset}>
          <Icon name="plus" className="size-4" />
          Add block
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          Total <span className="font-mono font-semibold text-foreground">{totalMin} min</span>
        </div>
      </div>

      <Button type="button" onClick={startSession} disabled={!blocks.length}>
        <Icon name="play" className="size-4" />
        Start session
      </Button>

      <p className="text-xs text-muted-foreground">
        Build a routine from the blocks above (reorder, rename, set minutes), then run it as a
        guided timed session — each block counts down and chimes when it's time to move on. Your
        routine is saved on this device, and time spent counts toward your practice streak.
      </p>
    </div>
  );
}
