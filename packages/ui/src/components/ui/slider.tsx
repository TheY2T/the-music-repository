import type * as React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'> {
  /** Controlled value (single-thumb). */
  value?: number;
  defaultValue?: number;
}

/**
 * Styled native range input (island-friendly; no cross-island context). The track is filled up to
 * the current value via a CSS gradient bound to `--slider-fill`, and the thumb is themed in both
 * WebKit and Firefox. Semantic tokens throughout so it re-themes with the site (ADR 0021).
 */
export function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const current = value ?? defaultValue ?? 0;
  const lo = Number(min);
  const hi = Number(max);
  const pct = hi > lo ? ((Number(current) - lo) / (hi - lo)) * 100 : 0;
  return (
    <input
      type="range"
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      style={{ '--slider-fill': `${pct}%` } as React.CSSProperties}
      className={cn(
        'h-2 w-full cursor-pointer appearance-none rounded-full bg-muted outline-none',
        '[background:linear-gradient(to_right,var(--primary)_var(--slider-fill),var(--muted)_var(--slider-fill))]',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Thumb — WebKit
        '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow',
        // Thumb — Firefox
        '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow',
        className,
      )}
      {...props}
    />
  );
}
