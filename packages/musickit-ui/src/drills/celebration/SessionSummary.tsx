import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { PixiCanvas } from '@TheY2T/tmr-music-core/pixi/PixiCanvas';
import { usePrefersReducedMotion } from '@TheY2T/tmr-music-core/pixi/use-webgl';
import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { starsForAccuracy } from './celebration-tiers';
import LevelUpFanfare from './LevelUpFanfare';

/** Count from 0 → target over ~600ms; instant under reduced motion. No `performance.now` (SSR-safe). */
function useCountUp(target: number, reduced: boolean): number {
  const [n, setN] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setN(target);
      return;
    }
    setN(0);
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const id = window.setInterval(() => {
      cur = Math.min(cur + step, target);
      setN(cur);
      if (cur >= target) {
        window.clearInterval(id);
      }
    }, 30);
    return () => window.clearInterval(id);
  }, [target, reduced]);
  return n;
}

/**
 * Tier-3 milestone reward: the session-complete summary — a 1–3 star rating on accuracy, counting-up
 * stats, an optional personal-best callout, and a confetti fall behind it. Confetti + count-up degrade
 * to static under reduced motion.
 */
export default function SessionSummary({
  reviewed,
  correctCount,
  personalBest,
  leveledUpTo,
  locale,
  celebrations = true,
}: {
  reviewed: number;
  correctCount: number;
  personalBest: boolean;
  /** The highest mastery level reached during the session, if any deck levelled up. */
  leveledUpTo?: string | null;
  locale: Locale;
  celebrations?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const accuracy = reviewed === 0 ? 0 : Math.round((correctCount / reviewed) * 100);
  const stars = starsForAccuracy(reviewed === 0 ? 0 : correctCount / reviewed);
  const shownAccuracy = useCountUp(accuracy, reduced);
  const shownCount = useCountUp(reviewed, reduced);

  return (
    <div className="relative space-y-5 py-4 text-center">
      {celebrations ? (
        <PixiCanvas
          decorative
          loader={() => import('@TheY2T/tmr-music-core/pixi/confetti-scene')}
          sceneProps={{ fire: 1 }}
          className="pointer-events-none fixed inset-0 z-40"
          containerClassName="h-full w-full"
          fallback={<div aria-hidden />}
        />
      ) : null}

      <p className="flex items-center justify-center gap-2 text-lg font-medium">
        <Icon name="party-popper" className="size-5" />
        {t(locale, 'drill.sessionComplete')}
      </p>

      <div
        className="flex items-center justify-center gap-1"
        role="img"
        aria-label={t(locale, 'drill.stars', { earned: stars })}
      >
        {[0, 1, 2].map((i) => (
          <Icon
            key={i}
            name="star"
            className={cn('size-8', i < stars ? 'text-warning' : 'text-muted-foreground/30')}
          />
        ))}
      </div>

      <p className="text-muted-foreground">
        {t(locale, 'drill.reviewedCount', { count: shownCount })} ·{' '}
        {t(locale, 'drill.accuracy', { percent: shownAccuracy })}
      </p>

      {leveledUpTo ? <LevelUpFanfare level={leveledUpTo} locale={locale} /> : null}

      {personalBest ? (
        <p className="flex items-center justify-center gap-1 font-semibold text-warning">
          <Icon name="trophy" className="size-4" />
          {t(locale, 'drill.celebrate.newBest')}
        </p>
      ) : null}

      <a href={localizedPath(locale, '/drills')}>
        <Button variant="outline">{t(locale, 'review.backToDrills')}</Button>
      </a>
    </div>
  );
}
