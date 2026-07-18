import { type MessageKey, t } from '@TheY2T/tmr-i18n';
import { getAudioContext, scheduleClick, scheduleDrum } from '@TheY2T/tmr-music-core/audio';
import { patternOnsets } from '@TheY2T/tmr-music-core/drills/rhythm-grade';
import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DrillInputProps } from './types';

const COUNT_IN = 4;

/**
 * Rhythm-tap answer input: hear the one-bar pattern (a count-in then the rhythm), then tap it back on
 * the pad (or Space) — taps are normalized to beats (tap 1 = the downbeat) and submitted for timing
 * grading. Explore-then-submit: tap freely, Clear to redo, Submit to commit.
 */
export default function RhythmTapInput({ item, answered, onAnswer, locale }: DrillInputProps) {
  const rhythm = item.presentation.kind === 'rhythm' ? item.presentation : null;
  const [taps, setTaps] = useState<number[]>([]);
  const [flash, setFlash] = useState(0);
  const padRef = useRef<HTMLButtonElement>(null);
  const locked = answered != null;

  const instruction = item.instruction
    ? t(locale, item.instruction.key as MessageKey, item.instruction.params)
    : t(locale, 'drill.tapRhythm');

  const play = useCallback(() => {
    if (!rhythm) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) {
      return;
    }
    const beat = 60 / rhythm.bpm;
    const start = ctx.currentTime + 0.2;
    for (let i = 0; i < COUNT_IN; i += 1) {
      scheduleClick(start + i * beat, i === 0);
    }
    const patStart = start + COUNT_IN * beat;
    for (const onset of patternOnsets(rhythm.pattern)) {
      scheduleDrum('snare', patStart + onset * beat);
    }
  }, [rhythm]);

  // Auto-play the pattern + reset taps on each new card.
  useEffect(() => {
    setTaps([]);
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.card]);

  function tap() {
    if (locked) {
      return;
    }
    setTaps((prev) => [...prev, performance.now()]);
    setFlash((n) => n + 1);
  }

  function submit() {
    if (!rhythm || taps.length === 0) {
      return;
    }
    const beatMs = 60000 / rhythm.bpm;
    const first = taps[0];
    onAnswer(taps.map((tapMs) => ((tapMs - first) / beatMs).toFixed(3)).join(','));
  }

  return (
    <div className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">{instruction}</p>
      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={play} disabled={locked}>
          <Icon name="play" className="size-4" />
          {t(locale, 'drill.replay')}
        </Button>
      </div>

      <button
        ref={padRef}
        type="button"
        disabled={locked}
        onPointerDown={(e) => {
          e.preventDefault();
          tap();
        }}
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            tap();
          }
        }}
        aria-label={t(locale, 'drill.tapPad')}
        className={cn(
          'mx-auto flex h-32 w-full max-w-sm items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-transform disabled:cursor-not-allowed',
          !locked && 'hover:bg-muted active:scale-[0.98]',
        )}
      >
        <span key={flash} className="flex flex-col items-center gap-1">
          <Icon name="hand" className="size-8" />
          <span className="text-sm">{t(locale, 'drill.tapCount', { count: taps.length })}</span>
        </span>
      </button>

      {!locked ? (
        <div className="flex justify-center gap-3">
          <Button variant="ghost" onClick={() => setTaps([])} disabled={taps.length === 0}>
            {t(locale, 'drill.clear')}
          </Button>
          <Button onClick={submit} disabled={taps.length === 0}>
            {t(locale, 'drill.submit')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
