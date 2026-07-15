import { type Locale, t } from '@TheY2T/tmr-i18n';
import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useRef, useState } from 'react';
import { PixiCanvas } from '@/components/PixiCanvas';
import { playTone } from '@/lib/audio';
import { beatsFor, valueLabel } from '@/lib/rhythm';

/**
 * A note-value rhythm visualiser: one bar of blocks sized by duration, clicked out at a tempo with a
 * moving highlight. This island owns the timing + click; the Pixi strip ({@link RhythmScene}) is
 * presentational. The `rhythm` content embed (ADR 0029). English UI strings match the other tools.
 */
const loadScene = () => import('@/lib/pixi/rhythm-scene');

export default function Rhythm({
  values,
  tempo = 84,
  locale,
}: {
  values: string[];
  tempo?: number;
  locale: Locale;
}) {
  const [playing, setPlaying] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef(0);
  const idx = useRef(0);

  useEffect(() => {
    if (!playing) return;
    idx.current = 0;
    const beatMs = (60 / tempo) * 1000;
    const step = () => {
      const i = idx.current;
      setActive(i);
      playTone(1000, 0.04); // metronome click on each onset
      const holdMs = beatsFor(values[i]) * beatMs;
      idx.current = (i + 1) % values.length;
      timer.current = window.setTimeout(step, holdMs);
    };
    step();
    return () => {
      window.clearTimeout(timer.current);
      setActive(-1);
    };
  }, [playing, values, tempo]);

  return (
    <div className="space-y-3">
      <PixiCanvas
        ariaLabel={t(locale, 'embed.rhythm')}
        loader={loadScene}
        sceneProps={{ values, activeIndex: active }}
        containerClassName="h-20 w-full rounded-lg border border-border bg-card"
        fallback={
          <div className="flex gap-1">
            {values.map((v, i) => (
              <span
                key={`v${i}`}
                style={{ flexGrow: beatsFor(v) }}
                className={cn(
                  'flex h-14 items-center justify-center rounded-lg border border-border text-xs font-semibold',
                  active === i ? 'bg-accent text-accent-foreground' : 'bg-card',
                )}
              >
                {valueLabel(v)}
              </span>
            ))}
          </div>
        }
      />
      <Button type="button" size="sm" onClick={() => setPlaying((p) => !p)}>
        <Icon name={playing ? 'pause' : 'play'} className="size-4" />
        {t(locale, playing ? 'score.stop' : 'score.play')}
      </Button>
    </div>
  );
}
