import type * as React from 'react';
import { cn } from '../../lib/utils';

export interface CardGridProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Max columns at the largest breakpoint (2 or 3). Defaults to 3. */
  columns?: 2 | 3;
}

/**
 * Responsive card grid — the shared version of the repeated
 * `ul.grid gap-4 sm:grid-cols-2 lg:grid-cols-3` list layout (catalogue, collections, admin lists).
 * Render `<li>` children (use `CardGridItem` or a `Card` inside an `<li>`).
 */
export function CardGrid({ className, columns = 3, ...props }: CardGridProps) {
  return (
    <ul
      className={cn('grid gap-4 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3', className)}
      {...props}
    />
  );
}
