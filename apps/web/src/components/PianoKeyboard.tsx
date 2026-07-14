import { cn, Icon, Select } from '@TheY2T/tmr-ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PixiCanvas } from '@/components/PixiCanvas';
import { playTone } from '@/lib/audio';
import {
  midiToFrequency,
  pitchName,
  ROOT_CHOICES,
  SCALES,
  scalePitchClasses,
} from '@/lib/music-theory';
import { useMidiInput } from '@/lib/use-midi-input';

const START_MIDI = 60; // C4
const KEY_COUNT = 24; // two octaves
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

const midis = Array.from({ length: KEY_COUNT }, (_, i) => START_MIDI + i);
const isBlack = (midi: number) => BLACK_PCS.has(midi % 12);
const whiteMidis = midis.filter((m) => !isBlack(m));
const blackMidis = midis.filter(isBlack).map((midi) => ({
  midi,
  afterWhiteIndex: midis.filter((m) => !isBlack(m) && m < midi).length - 1,
}));
const whiteWidthPct = 100 / whiteMidis.length;

const noteLabel = (midi: number, flats: boolean) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

export default function PianoKeyboard() {
  const [showLabels, setShowLabels] = useState(true);
  const [root, setRoot] = useState<number | null>(null);
  const [scaleKey, setScaleKey] = useState('major');
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [midiActive, setMidiActive] = useState<Set<number>>(new Set());
  const [clicked, setClicked] = useState<Set<number>>(new Set());
  const releaseTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const highlighted = useMemo(
    () => (root === null ? new Set<number>() : scalePitchClasses(root, scale.intervals)),
    [root, scale],
  );
  const flats = root !== null && [1, 3, 5, 8, 10].includes(root);

  // Notes currently sounding (glow + particles): held MIDI notes ∪ momentary clicks.
  const active = useMemo(() => new Set([...midiActive, ...clicked]), [midiActive, clicked]);

  const flash = useCallback((midi: number) => {
    setClicked((prev) => new Set(prev).add(midi));
    const timers = releaseTimers.current;
    clearTimeout(timers.get(midi));
    timers.set(
      midi,
      setTimeout(() => {
        setClicked((prev) => {
          const next = new Set(prev);
          next.delete(midi);
          return next;
        });
        timers.delete(midi);
      }, 450),
    );
  }, []);

  const play = useCallback(
    (midi: number) => {
      playTone(midiToFrequency(midi));
      setLastNote(noteLabel(midi, flats));
      flash(midi);
    },
    [flats, flash],
  );

  // Live MIDI input: sound + highlight incoming notes.
  const onMidiNote = useCallback((midi: number, isOn: boolean) => {
    setMidiActive((prev) => {
      const next = new Set(prev);
      if (isOn) {
        next.add(midi);
      } else {
        next.delete(midi);
      }
      return next;
    });
    if (isOn) {
      playTone(midiToFrequency(midi));
      setLastNote(`${pitchName(midi % 12)}${Math.floor(midi / 12) - 1}`);
    }
  }, []);
  const midi = useMidiInput(onMidiNote);

  const inScale = (m: number) => highlighted.has(m % 12);

  // Accessible, token-themed DOM keyboard — the real control surface (visible when WebGL is
  // unavailable; kept operable but visually hidden behind the Pixi canvas otherwise).
  const fallbackKeyboard = (
    <div className="relative flex h-44 select-none rounded-lg border border-border bg-muted p-1">
      {whiteMidis.map((m) => (
        <button
          type="button"
          key={m}
          aria-label={noteLabel(m, flats)}
          aria-pressed={active.has(m)}
          onClick={() => play(m)}
          style={{ width: `${whiteWidthPct}%` }}
          className={cn(
            'relative flex items-end justify-center rounded-b border border-border pb-1 text-xs',
            inScale(m) ? 'bg-accent/30 text-foreground' : 'bg-card text-muted-foreground',
            active.has(m) && 'ring-2 ring-inset ring-ring',
          )}
        >
          {showLabels ? pitchName(m % 12, flats) : null}
        </button>
      ))}
      {blackMidis.map(({ midi: m, afterWhiteIndex }) => (
        <button
          type="button"
          key={m}
          aria-label={noteLabel(m, flats)}
          aria-pressed={active.has(m)}
          onClick={() => play(m)}
          style={{
            left: `${(afterWhiteIndex + 1) * whiteWidthPct}%`,
            width: `${whiteWidthPct * 0.62}%`,
            transform: 'translateX(-50%)',
          }}
          className={cn(
            'absolute top-1 z-10 flex h-[62%] items-end justify-center rounded-b pb-1 text-[10px]',
            inScale(m) ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background',
            active.has(m) && 'ring-2 ring-inset ring-ring',
          )}
        >
          {showLabels ? pitchName(m % 12, flats) : null}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Show note names
        </label>
        <label className="space-y-1 text-sm">
          <span className="block font-medium" data-help="scales">
            Highlight scale
          </span>
          <div className="flex gap-2">
            <Select
              value={root ?? ''}
              onChange={(e) => setRoot(e.target.value === '' ? null : Number(e.target.value))}
              className="h-auto w-auto px-2 py-1"
            >
              <option value="">— root —</option>
              {ROOT_CHOICES.map((pc) => (
                <option key={pc} value={pc}>
                  {pitchName(pc)}
                </option>
              ))}
            </Select>
            <Select
              value={scaleKey}
              onChange={(e) => setScaleKey(e.target.value)}
              className="h-auto w-auto px-2 py-1"
            >
              {SCALES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </label>
        <div className="ml-auto text-sm text-muted-foreground">
          Last note: <span className="font-mono text-foreground">{lastNote ?? '—'}</span>
        </div>
      </div>

      <div className="text-xs" data-help="keyboard">
        {!midi.supported ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon name="piano" className="size-4" /> Web MIDI not supported in this browser.
          </span>
        ) : midi.connected ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Icon name="piano" className="size-4" /> MIDI connected: {midi.deviceName ?? 'device'} —
            play your keyboard.
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon name="piano" className="size-4" /> MIDI ready — connect a keyboard to play it
            live.
          </span>
        )}
      </div>

      <PixiCanvas
        ariaLabel="Piano keyboard — two octaves from middle C"
        loader={() => import('@/lib/pixi/piano-scene')}
        sceneProps={{
          whiteMidis,
          blackMidis,
          highlighted,
          active,
          showLabels,
          flats,
          onPlay: play,
        }}
        containerClassName="h-44 rounded-lg border border-border bg-muted"
        fallback={fallbackKeyboard}
      />

      <p className="text-xs text-muted-foreground">
        Click a key to hear it. Pick a root + scale to highlight.
      </p>
    </div>
  );
}
