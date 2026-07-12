import { Icon, Select } from '@TheY2T/tmr-ui';
import { useCallback, useMemo, useState } from 'react';
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

export default function PianoKeyboard() {
  const [showLabels, setShowLabels] = useState(true);
  const [root, setRoot] = useState<number | null>(null);
  const [scaleKey, setScaleKey] = useState('major');
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [midiActive, setMidiActive] = useState<Set<number>>(new Set());

  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const highlighted = useMemo(
    () => (root === null ? new Set<number>() : scalePitchClasses(root, scale.intervals)),
    [root, scale],
  );
  const flats = root !== null && [1, 3, 5, 8, 10].includes(root);

  function play(midi: number) {
    playTone(midiToFrequency(midi));
    setLastNote(`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`);
  }

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

  const inScale = (midi: number) => highlighted.has(midi % 12);

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
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
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

      <div className="relative flex h-44 select-none rounded-lg border border-border bg-neutral-100 p-1">
        {whiteMidis.map((midi) => (
          <button
            type="button"
            key={midi}
            aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
            onClick={() => play(midi)}
            style={{ width: `${whiteWidthPct}%` }}
            className={`relative flex items-end justify-center rounded-b border border-neutral-300 pb-1 text-xs ${
              inScale(midi) ? 'bg-blue-200 text-blue-900' : 'bg-white text-neutral-500'
            } ${midiActive.has(midi) ? 'ring-2 ring-inset ring-green-500' : ''}`}
          >
            {showLabels ? pitchName(midi % 12, flats) : null}
          </button>
        ))}
        {blackMidis.map(({ midi, afterWhiteIndex }) => (
          <button
            type="button"
            key={midi}
            aria-label={`${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`}
            onClick={() => play(midi)}
            style={{
              left: `${(afterWhiteIndex + 1) * whiteWidthPct}%`,
              width: `${whiteWidthPct * 0.62}%`,
              transform: 'translateX(-50%)',
            }}
            className={`absolute top-1 z-10 flex h-[62%] items-end justify-center rounded-b pb-1 text-[10px] ${
              inScale(midi) ? 'bg-blue-500 text-white' : 'bg-neutral-800 text-neutral-300'
            } ${midiActive.has(midi) ? 'ring-2 ring-inset ring-green-400' : ''}`}
          >
            {showLabels ? pitchName(midi % 12, flats) : null}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Click a key to hear it. Pick a root + scale to highlight.
      </p>
    </div>
  );
}
