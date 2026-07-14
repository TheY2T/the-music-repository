import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface StarRatingProps {
  /** Current value (0..5). For readonly displays this can be fractional (the average). */
  value: number;
  /** Optional count shown after the stars (e.g. rating count). */
  count?: number;
  /** When false, stars are interactive and `onRate` fires with the chosen 1..5 value. */
  readOnly?: boolean;
  onRate?: (value: number) => void;
  size?: 'sm' | 'md';
  /** aria-label builder for each interactive star (i18n-by-prop). */
  ariaLabelFor?: (star: number) => string;
  className?: string;
}

const STARS = [1, 2, 3, 4, 5];

/**
 * Five-star rating — readonly (fractional fill via a width-clipped overlay) or interactive. Atoms
 * only (the `star` Icon); presentational + i18n-by-prop.
 */
export function StarRating({
  value,
  count,
  readOnly = true,
  onRate,
  size = 'md',
  ariaLabelFor,
  className,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-5';

  if (readOnly) {
    const pct = Math.max(0, Math.min(100, (value / 5) * 100));
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)}>
        <span className="relative inline-flex">
          <span className="inline-flex text-muted-foreground/40">
            {STARS.map((s) => (
              <Icon key={s} name="star" className={iconSize} />
            ))}
          </span>
          <span
            className="absolute inset-0 inline-flex overflow-hidden text-accent"
            style={{ width: `${pct}%` }}
            aria-hidden
          >
            {STARS.map((s) => (
              <Icon key={s} name="star" className={cn(iconSize, 'shrink-0 fill-current')} />
            ))}
          </span>
        </span>
        {count != null ? (
          <span className="text-xs text-muted-foreground tabular-nums">({count})</span>
        ) : null}
      </span>
    );
  }

  const shown = hover || value;
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {STARS.map((s) => (
        <button
          key={s}
          type="button"
          aria-label={ariaLabelFor?.(s)}
          aria-pressed={value === s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(s)}
          onBlur={() => setHover(0)}
          onClick={() => onRate?.(s)}
          className="rounded p-0.5 text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="star" className={cn(iconSize, s <= shown ? 'fill-current' : 'opacity-40')} />
        </button>
      ))}
    </span>
  );
}
