import { type Locale, t } from '@TheY2T/tmr-i18n';
import { playTone } from '@TheY2T/tmr-music-core/audio';
import { noteNameToPitchClass } from '@TheY2T/tmr-music-core/embeds';
import {
  FRET_MARKERS,
  midiToFrequency,
  pitchName,
  SCALES,
  scalePitchClasses,
} from '@TheY2T/tmr-music-core/music-theory';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { cn } from '@TheY2T/tmr-ui';
import { useCallback, useMemo, useRef, useState } from 'react';
import { TUNING_LOW_FIRST, UKULELE_TUNING_LOW_FIRST } from './organisms/index';

/**
 * A fretboard fingering chart for a scale on a fretted instrument (guitar / bass / ukulele) — shows the
 * scale's notes across the neck with roots highlighted; tap a note to hear it. This island owns the
 * audio + note glow; it reuses the Pixi {@link FretboardScene}. The `fingering` content embed (ADR 0029).
 * English UI strings match the other tools.
 */
const loadScene = () => import('@TheY2T/tmr-music-core/pixi/fretboard-scene');
const FRET_COUNT = 12;

/** Open-string MIDI (low string first) per instrument; standard 4-string bass added alongside the
 * shared guitar/ukulele tunings. An explicit `tuning` prop overrides. */
const INSTRUMENT_TUNING: Record<string, readonly number[]> = {
  guitar: TUNING_LOW_FIRST,
  bass: [28, 33, 38, 43],
  ukulele: UKULELE_TUNING_LOW_FIRST,
};

const noteLabel = (midi: number, flats: boolean) =>
  `${pitchName(midi % 12, flats)}${Math.floor(midi / 12) - 1}`;

export default function Fingering({
  instrument = 'guitar',
  tuning,
  root,
  scale: scaleKey = 'major',
  locale,
}: {
  instrument?: string;
  tuning?: number[];
  root?: string;
  scale?: string;
  locale: Locale;
}) {
  const [active, setActive] = useState<Set<number>>(new Set());
  const releaseTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const lowFirst = tuning ?? INSTRUMENT_TUNING[instrument] ?? TUNING_LOW_FIRST;
  const displayTuning = useMemo(() => [...lowFirst].reverse(), [lowFirst]); // high string on top
  const rootPc = noteNameToPitchClass(root);
  const scale = SCALES.find((s) => s.key === scaleKey) ?? SCALES[0];
  const flats = rootPc != null && [1, 3, 5, 8, 10].includes(rootPc);
  const highlighted = useMemo(
    () => (rootPc == null ? new Set<number>() : scalePitchClasses(rootPc, scale.intervals)),
    [rootPc, scale],
  );
  const tuningNames = displayTuning.map((m) => pitchName(m % 12, flats));

  const play = useCallback((midi: number) => {
    playTone(midiToFrequency(midi));
    setActive((prev) => new Set(prev).add(midi));
    const timers = releaseTimers.current;
    clearTimeout(timers.get(midi));
    timers.set(
      midi,
      setTimeout(
        () =>
          setActive((prev) => {
            const next = new Set(prev);
            next.delete(midi);
            return next;
          }),
        700,
      ),
    );
  }, []);

  return (
    <PixiCanvas
      ariaLabel={t(locale, 'embed.fingering')}
      loader={loadScene}
      sceneProps={{
        tuning: displayTuning,
        tuningNames,
        fretCount: FRET_COUNT,
        fretMarkers: FRET_MARKERS,
        highlighted,
        root: rootPc,
        active,
        showLabels: true,
        flats,
        onPlay: play,
      }}
      containerClassName="h-40 w-full rounded-lg border border-border bg-muted"
      fallback={
        <div className="space-y-1">
          {displayTuning.map((open, s) => (
            <div key={`s${s}`} className="flex items-center gap-1">
              <span className="w-5 text-xs text-muted-foreground">{tuningNames[s]}</span>
              {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
                const midi = open + fret;
                const inScale = highlighted.has(midi % 12);
                if (!inScale) return <span key={`f${fret}`} className="size-6" />;
                const isRoot = rootPc != null && midi % 12 === rootPc;
                return (
                  <button
                    key={`f${fret}`}
                    type="button"
                    onClick={() => play(midi)}
                    aria-label={noteLabel(midi, flats)}
                    className={cn(
                      'size-6 rounded-full border text-[10px]',
                      isRoot
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-accent/30',
                    )}
                  >
                    {pitchName(midi % 12, flats)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      }
    />
  );
}
