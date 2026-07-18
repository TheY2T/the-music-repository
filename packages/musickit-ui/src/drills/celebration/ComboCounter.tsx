import { usePrefersReducedMotion } from '@TheY2T/tmr-music-core/pixi/use-webgl';
import { cn, Icon } from '@TheY2T/tmr-ui';
import { COMBO_THRESHOLDS } from './celebration-tiers';

/**
 * Tier-2 combo counter: a flame + streak count that escalates in colour/size as the run crosses the
 * configured thresholds, and pops on each increment (static under reduced motion). Hidden below 2.
 */
export default function ComboCounter({
  combo,
  label,
}: {
  combo: number;
  /** Localized "{count} in a row!" template. */
  label: (count: number) => string;
}) {
  const reduced = usePrefersReducedMotion();
  if (combo < 2) {
    return null;
  }
  // How many thresholds (5/10/20) the run has crossed → 0–3 intensity.
  const tier = (COMBO_THRESHOLDS as readonly number[]).filter((t) => combo >= t).length;
  const color =
    tier >= 3
      ? 'text-warning'
      : tier >= 2
        ? 'text-accent'
        : tier >= 1
          ? 'text-success'
          : 'text-foreground';

  return (
    <span
      key={combo}
      className={cn(
        'inline-flex items-center gap-1 font-semibold tabular-nums',
        tier >= 3 ? 'text-base' : 'text-sm',
        color,
        !reduced && 'tmr-combo-pop',
      )}
    >
      <Icon name="flame" className={cn(tier >= 3 ? 'size-4' : 'size-3.5')} />
      {label(combo)}
      {!reduced ? (
        <style>{`@keyframes tmr-combo-pop {0%{transform:scale(1)}35%{transform:scale(1.25)}100%{transform:scale(1)}}
          .tmr-combo-pop{animation:tmr-combo-pop .3s cubic-bezier(0.2,0.8,0.2,1)}`}</style>
      ) : null}
    </span>
  );
}
