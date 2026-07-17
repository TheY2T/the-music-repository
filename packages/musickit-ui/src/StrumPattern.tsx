import { type Locale, t } from '@TheY2T/tmr-i18n';
import { playTone } from '@TheY2T/tmr-music-core/audio';
import { findChordShape, tuningFor } from '@TheY2T/tmr-music-core/embeds';
import { midiToFrequency } from '@TheY2T/tmr-music-core/music-theory';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';

/**
 * A strum/picking-pattern player: one bar of cells (↓ down, ↑ up, · rest) with an animated Pixi
 * play-head, looping over the given chord(s) at a set tempo. This island owns the timing + audio; the
 * Pixi strip ({@link StrumScene}) is presentational. Used as the `strum` content embed (ADR 0029).
 * English UI strings match the other tools.
 */
const loadScene = () => import('@TheY2T/tmr-music-core/pixi/strum-scene');

function strumChord(frets: number[], tuning: number[], up: boolean): void {
  const order = frets.map((_, i) => i);
  if (up) order.reverse();
  let delay = 0;
  for (const i of order) {
    if (frets[i] < 0) continue;
    const midi = tuning[i] + frets[i];
    window.setTimeout(() => playTone(midiToFrequency(midi), 0.9), delay);
    delay += 18;
  }
}

export default function StrumPattern({
  pattern,
  chords,
  tempo = 90,
  instrument,
  locale,
}: {
  pattern: string[];
  chords?: string[];
  tempo?: number;
  instrument?: string;
  locale: Locale;
}) {
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);
  const tuning = tuningFor(instrument);
  const timer = useRef(0);
  const cellRef = useRef(0);
  const barRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    cellRef.current = 0;
    barRef.current = 0;
    const stepMs = (60 / tempo / 2) * 1000; // eighth-note cells
    const step = () => {
      const i = cellRef.current;
      setActive(i);
      const cell = pattern[i];
      if ((cell === 'D' || cell === 'U') && chords?.length) {
        const symbol = chords[barRef.current % chords.length];
        const shape = findChordShape(symbol, instrument);
        if (shape) strumChord(shape.frets, tuning, cell === 'U');
      }
      cellRef.current += 1;
      if (cellRef.current >= pattern.length) {
        cellRef.current = 0;
        barRef.current += 1;
      }
      timer.current = window.setTimeout(step, stepMs);
    };
    step();
    return () => {
      window.clearTimeout(timer.current);
      setActive(-1);
    };
  }, [playing, pattern, chords, tempo, instrument, tuning]);

  return (
    <div className="space-y-3">
      <PixiCanvas
        ariaLabel={t(locale, 'embed.strum')}
        loader={loadScene}
        sceneProps={{ cells: pattern, activeIndex: active }}
        containerClassName="h-24 w-full rounded-lg border border-border bg-card"
        fallback={
          <div className="flex gap-1">
            {pattern.map((cell, i) => (
              <span
                key={`c${i}`}
                className={cn(
                  'flex h-12 flex-1 items-center justify-center rounded-lg border border-border text-lg font-semibold',
                  active === i ? 'bg-accent text-accent-foreground' : 'bg-card',
                  cell !== 'D' && cell !== 'U' && 'text-muted-foreground',
                )}
              >
                {cell === 'D' ? '↓' : cell === 'U' ? '↑' : '·'}
              </span>
            ))}
          </div>
        }
      />
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={() => setPlaying((p) => !p)}>
          <Icon name={playing ? 'pause' : 'play'} className="size-4" />
          {t(locale, playing ? 'score.stop' : 'score.play')}
        </Button>
        {chords?.length ? (
          <span className="text-sm text-muted-foreground">{chords.join(' · ')}</span>
        ) : null}
      </div>
    </div>
  );
}
