import { useCallback, useEffect, useState } from 'react';
import { pitchName } from '@/lib/music-theory';
import {
  isSampled,
  loadSoundfont,
  playNote,
  SOUNDFONT_INSTRUMENTS,
  type SoundfontStatus,
} from '@/lib/soundfont';
import { useMidiInput } from '@/lib/use-midi-input';

const START_MIDI = 48; // C3
const KEY_COUNT = 25; // two octaves + top C
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

const midis = Array.from({ length: KEY_COUNT }, (_, i) => START_MIDI + i);
const isBlack = (midi: number) => BLACK_PCS.has(midi % 12);
const whiteMidis = midis.filter((m) => !isBlack(m));
const blackMidis = midis.filter(isBlack).map((midi) => ({
  midi,
  afterWhiteIndex: midis.filter((m) => !isBlack(m) && m < midi).length - 1,
}));
const whiteWidthPct = 100 / whiteMidis.length;

const label = (midi: number) => `${pitchName(midi % 12)}${Math.floor(midi / 12) - 1}`;

export default function SoundfontPlayer() {
  const [instrument, setInstrument] = useState<string>(SOUNDFONT_INSTRUMENTS[0].name);
  const [status, setStatus] = useState<SoundfontStatus>('idle');
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [active, setActive] = useState<Set<number>>(new Set());

  // Load the selected soundfont whenever it changes.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadSoundfont(instrument).then((result) => {
      if (!cancelled) {
        setStatus(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [instrument]);

  const play = useCallback((midi: number) => {
    playNote(midi);
    setLastNote(label(midi));
  }, []);

  // Live MIDI input plays through the same engine.
  const onMidiNote = useCallback(
    (midi: number, isOn: boolean) => {
      setActive((prev) => {
        const next = new Set(prev);
        if (isOn) {
          next.add(midi);
        } else {
          next.delete(midi);
        }
        return next;
      });
      if (isOn) {
        play(midi);
      }
    },
    [play],
  );
  const midiSupported = useMidiInput(onMidiNote);

  const message =
    status === 'loading'
      ? 'Loading instrument samples…'
      : status === 'fallback'
        ? 'Samples unavailable (offline?) — using the built-in synth.'
        : status === 'sampled'
          ? isSampled()
            ? 'Sampled instrument ready.'
            : ''
          : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium">Instrument</span>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1"
          >
            {SOUNDFONT_INSTRUMENTS.map((inst) => (
              <option key={inst.name} value={inst.name}>
                {inst.label}
              </option>
            ))}
          </select>
        </label>
        {lastNote ? (
          <span className="text-sm text-muted-foreground">
            Last note: <strong>{lastNote}</strong>
          </span>
        ) : null}
      </div>

      {message ? (
        <p
          className={`text-sm ${status === 'fallback' ? 'text-amber-600' : 'text-muted-foreground'}`}
        >
          {message}
        </p>
      ) : null}

      <div className="relative h-44 select-none">
        {whiteMidis.map((midi, i) => (
          <button
            type="button"
            key={midi}
            onPointerDown={() => play(midi)}
            className={`absolute top-0 h-full rounded-b-md border border-border ${
              active.has(midi) ? 'bg-primary/30' : 'bg-white'
            }`}
            style={{ left: `${i * whiteWidthPct}%`, width: `${whiteWidthPct}%` }}
          >
            <span className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted-foreground">
              {midi % 12 === 0 ? label(midi) : ''}
            </span>
          </button>
        ))}
        {blackMidis.map(({ midi, afterWhiteIndex }) => (
          <button
            type="button"
            key={midi}
            onPointerDown={(e) => {
              e.stopPropagation();
              play(midi);
            }}
            className={`absolute top-0 z-10 h-2/3 rounded-b-md border border-border ${
              active.has(midi) ? 'bg-primary' : 'bg-neutral-900'
            }`}
            style={{
              left: `${(afterWhiteIndex + 1) * whiteWidthPct - whiteWidthPct * 0.3}%`,
              width: `${whiteWidthPct * 0.6}%`,
            }}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Sampled General-MIDI instruments via <strong>smplr</strong> — richer than the built-in
        oscillator. Samples stream on demand; if they can't load, the keyboard falls back to the
        synth so it always plays.
        {midiSupported ? ' A connected MIDI keyboard plays through the same instrument.' : ''}
      </p>
    </div>
  );
}
