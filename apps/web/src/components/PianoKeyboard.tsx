import { Button, cn, Icon, Select } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixiCanvas } from '@/components/PixiCanvas';
import { DEFAULT_KEYBOARD_KEYS, KEYBOARD_SIZES, layoutForKeys, qwertyMap } from '@/lib/keyboard';
import { pitchName, ROOT_CHOICES, SCALES, scalePitchClasses } from '@/lib/music-theory';
import {
  DEFAULT_INSTRUMENT,
  isSampled,
  loadInstrument,
  noteOff,
  noteOn,
  releaseAll,
  SOUNDFONT_INSTRUMENTS,
  type SoundfontStatus,
} from '@/lib/soundfont';
import { useMidiInput } from '@/lib/use-midi-input';

/**
 * The shared interactive keyboard. One island for /tools/keyboard and /tools/soundfont: selectable
 * standard sizes (25/37/49/61/76/88), sampled audio (smplr) with oscillator fallback, sustain via
 * note-on/note-off, MIDI velocity, computer-keyboard (QWERTY) play, and octave shift + horizontal
 * scroll for the big layouts. Geometry comes from `lib/keyboard.ts`; the WebGL keybed is Pixi with an
 * accessible DOM fallback (ADR 0022). Note strings are English to match the other keyboard tools.
 */
const MIN_WHITE_PX = 34; // playable minimum white-key width; wider layouts scroll horizontally.
const POINTER_VELOCITY = 100;

const noteLabel = (midi: number, flats = false) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

interface PianoKeyboardProps {
  /** Show the instrument picker (sampled General-MIDI menu). */
  instruments?: boolean;
  /** Initial key count — one of KEYBOARD_SIZES (default 61). */
  defaultSize?: number;
  /** Instrument to load by default (GM name). */
  defaultInstrument?: string;
  /** Show the "highlight a scale" controls. */
  scaleHighlight?: boolean;
  /** Preselect a scale root (pitch class 0–11) for the highlight — for catalogue embeds. */
  defaultRoot?: number | null;
  /** Preselect the highlighted scale id (e.g. `major`, `minor-pentatonic`). */
  defaultScale?: string;
  ariaLabel?: string;
}

export default function PianoKeyboard({
  instruments = false,
  defaultSize = DEFAULT_KEYBOARD_KEYS,
  defaultInstrument = DEFAULT_INSTRUMENT,
  scaleHighlight = false,
  defaultRoot = null,
  defaultScale = 'major',
  ariaLabel = 'Piano keyboard',
}: PianoKeyboardProps) {
  const [keys, setKeys] = useState(defaultSize);
  const [instrument, setInstrument] = useState(defaultInstrument);
  const [status, setStatus] = useState<SoundfontStatus>('idle');
  // Gate the keyboard behind a spinner until the first instrument load resolves (sampled or fallback),
  // so the first note doesn't lag on sample-fetch latency. Sticky — later instrument swaps don't re-gate.
  const [ready, setReady] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [active, setActive] = useState<Set<number>>(new Set());
  const [root, setRoot] = useState<number | null>(defaultRoot);
  const [scaleKey, setScaleKey] = useState(defaultScale);

  const { midis, whiteMidis, blackMidis, whiteWidthPct } = useMemo(
    () => layoutForKeys(keys),
    [keys],
  );
  const firstMidi = midis[0];
  const lastMidi = midis[midis.length - 1];

  // Octave-shift base for the QWERTY layout (the note bound to `z`). Clamp into the current range.
  const [qwertyBase, setQwertyBase] = useState(() => Math.max(firstMidi, 60));
  useEffect(() => {
    setQwertyBase((b) => Math.min(Math.max(b, firstMidi), Math.max(firstMidi, lastMidi - 12)));
  }, [firstMidi, lastMidi]);

  const activeRef = useRef<Set<number>>(new Set());
  const instrumentRef = useRef(instrument);
  const qwertyBaseRef = useRef(qwertyBase);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  instrumentRef.current = instrument;
  qwertyBaseRef.current = qwertyBase;

  // Load the selected instrument (both tools get sampled audio; fallback keeps sound offline).
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadInstrument(instrument).then((s) => {
      if (!cancelled) {
        setStatus(s);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  // Stable note-on/off (read instrument from a ref so window listeners bind once).
  const press = useCallback((midi: number, velocity?: number) => {
    if (activeRef.current.has(midi)) return; // already sounding (auto-repeat / duplicate)
    noteOn(midi, { velocity, instrument: instrumentRef.current });
    activeRef.current.add(midi);
    setActive(new Set(activeRef.current));
    setLastNote(noteLabel(midi));
  }, []);

  const release = useCallback((midi: number) => {
    if (!activeRef.current.has(midi)) return;
    noteOff(midi, { instrument: instrumentRef.current });
    activeRef.current.delete(midi);
    setActive(new Set(activeRef.current));
  }, []);

  // Live MIDI input → sound + highlight, with velocity dynamics.
  const onMidiNote = useCallback(
    (midi: number, isOn: boolean, velocity: number) => {
      if (isOn) press(midi, velocity);
      else release(midi);
    },
    [press, release],
  );
  const midi = useMidiInput(onMidiNote);

  // Computer-keyboard (QWERTY) play — physical `code`s so it's layout-agnostic.
  useEffect(() => {
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      );
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const note = qwertyMap(qwertyBaseRef.current).get(e.code);
      if (note == null) return;
      e.preventDefault();
      press(note, POINTER_VELOCITY);
    };
    const up = (e: KeyboardEvent) => {
      const note = qwertyMap(qwertyBaseRef.current).get(e.code);
      if (note != null) release(note);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [press, release]);

  // Never leak held notes: release everything on blur and unmount.
  useEffect(() => {
    const panic = () => {
      for (const m of activeRef.current) noteOff(m, { instrument: instrumentRef.current });
      activeRef.current.clear();
      setActive(new Set());
      releaseAll();
    };
    window.addEventListener('blur', panic);
    return () => {
      window.removeEventListener('blur', panic);
      panic();
    };
  }, []);

  // Bring the QWERTY octave into view when it shifts (large keyboards scroll).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const whiteIndex = whiteMidis.filter((m) => m < qwertyBase).length;
    const keyPx = el.scrollWidth / Math.max(1, whiteMidis.length);
    el.scrollTo({ left: Math.max(0, whiteIndex * keyPx - keyPx), behavior: 'smooth' });
  }, [qwertyBase, whiteMidis]);

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const highlighted = useMemo(
    () => (root === null ? new Set<number>() : scalePitchClasses(root, scale.intervals)),
    [root, scale],
  );
  const flats = root !== null && [1, 3, 5, 8, 10].includes(root);
  const inScale = (m: number) => highlighted.has(m % 12);

  const shiftOctave = (delta: number) =>
    setQwertyBase((b) =>
      Math.min(Math.max(b + delta * 12, firstMidi), Math.max(firstMidi, lastMidi - 12)),
    );

  const minWidth = whiteMidis.length * MIN_WHITE_PX;

  const instrumentMessage =
    !instruments || status === 'idle'
      ? ''
      : status === 'loading'
        ? 'Loading instrument samples…'
        : status === 'fallback'
          ? 'Samples unavailable (offline?) — using the built-in synth.'
          : isSampled(instrument)
            ? 'Sampled instrument ready.'
            : '';

  // Show a spinner until the instrument's samples are ready (or the fallback kicks in), then the tool.
  if (!ready) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted text-muted-foreground">
        <Icon name="loader" className="size-6 animate-spin" />
        <span className="text-sm">Loading keyboard…</span>
      </div>
    );
  }

  // Accessible, token-themed DOM keyboard — the real control surface; visible when WebGL is absent.
  const fallbackKeyboard = (
    <div className="relative flex h-44 select-none rounded-lg border border-border bg-muted p-1">
      {whiteMidis.map((m) => (
        <button
          type="button"
          key={m}
          aria-label={noteLabel(m, flats)}
          aria-pressed={active.has(m)}
          onPointerDown={() => press(m, POINTER_VELOCITY)}
          onPointerUp={() => release(m)}
          onPointerLeave={() => release(m)}
          onPointerCancel={() => release(m)}
          style={{ width: `${whiteWidthPct}%` }}
          className={cn(
            'relative flex items-end justify-center rounded-b border border-border pb-1 text-xs',
            inScale(m) ? 'bg-accent/30 text-foreground' : 'bg-card text-muted-foreground',
            active.has(m) && 'ring-2 ring-inset ring-ring',
          )}
        >
          {showLabels && m % 12 === 0 ? noteLabel(m, flats) : null}
        </button>
      ))}
      {blackMidis.map(({ midi: m, afterWhiteIndex }) => (
        <button
          type="button"
          key={m}
          aria-label={noteLabel(m, flats)}
          aria-pressed={active.has(m)}
          onPointerDown={(e) => {
            e.stopPropagation();
            press(m, POINTER_VELOCITY);
          }}
          onPointerUp={() => release(m)}
          onPointerLeave={() => release(m)}
          onPointerCancel={() => release(m)}
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
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1 text-sm">
          <span className="block font-medium">Keyboard size</span>
          <Select
            value={keys}
            onChange={(e) => setKeys(Number(e.target.value))}
            className="h-auto w-auto px-2 py-1"
          >
            {KEYBOARD_SIZES.map((s) => (
              <option key={s.keys} value={s.keys}>
                {s.label}
              </option>
            ))}
          </Select>
        </label>

        {instruments ? (
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Instrument</span>
            <Select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="h-auto w-auto px-2 py-1"
            >
              {SOUNDFONT_INSTRUMENTS.map((inst) => (
                <option key={inst.name} value={inst.name}>
                  {inst.label}
                </option>
              ))}
            </Select>
          </label>
        ) : null}

        <div className="space-y-1 text-sm">
          <span className="block font-medium">Octave</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Octave down"
              onClick={() => shiftOctave(-1)}
              disabled={qwertyBase <= firstMidi}
            >
              <Icon name="chevron-left" className="size-4" />
            </Button>
            <span className="w-10 text-center font-mono text-xs text-muted-foreground">
              {noteLabel(qwertyBase)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Octave up"
              onClick={() => shiftOctave(1)}
              disabled={qwertyBase >= lastMidi - 12}
            >
              <Icon name="chevron-right" className="size-4" />
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Show note names
        </label>

        {scaleHighlight ? (
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
        ) : null}

        <div className="ml-auto text-sm text-muted-foreground">
          Last note: <span className="font-mono text-foreground">{lastNote ?? '—'}</span>
        </div>
      </div>

      {instrumentMessage ? (
        <p
          className={cn(
            'text-sm',
            status === 'fallback' ? 'text-amber-600' : 'text-muted-foreground',
          )}
        >
          {instrumentMessage}
        </p>
      ) : null}

      <div className="text-xs" data-help="keyboard">
        {!midi.supported ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon name="piano" className="size-4" /> Play with your mouse or computer keyboard (Web
            MIDI not supported here).
          </span>
        ) : midi.connected ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Icon name="piano" className="size-4" /> MIDI connected: {midi.deviceName ?? 'device'} —
            play your keyboard.
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Icon name="piano" className="size-4" /> MIDI ready — or play with your mouse / computer
            keyboard.
          </span>
        )}
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="relative w-full" style={{ minWidth: `${minWidth}px` }}>
          <PixiCanvas
            ariaLabel={`${ariaLabel} — ${keys} keys`}
            loader={() => import('@/lib/pixi/piano-scene')}
            sceneProps={{
              whiteMidis,
              blackMidis,
              highlighted,
              active,
              showLabels,
              flats,
              onPlay: (m: number) => press(m, POINTER_VELOCITY),
              onRelease: release,
            }}
            containerClassName="h-44 w-full rounded-lg border border-border bg-muted"
            fallback={fallbackKeyboard}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click or hold a key, play the <span className="font-mono">z</span>/
        <span className="font-mono">q</span> rows on your keyboard, or connect a MIDI device. Use
        the octave buttons to move the computer-keyboard range.
      </p>
    </div>
  );
}
