import type * as React from 'react';
import { Children } from 'react';
import { cn } from '../../lib/utils';

export interface FeaturedShelfProps {
  title: React.ReactNode;
  /** Optional right-aligned action (e.g. a "view all" link). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Titled horizontal scroller section (e.g. "Featured this week"). Children snap-scroll in a row that
 * scrolls within itself, so the page body never scrolls horizontally. Each child keeps a fixed width.
 */
export function FeaturedShelf({ title, action, children, className }: FeaturedShelfProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {/* Wrap each child in a fixed-width cell that stretches to the tallest, so cards (with `h-full`)
          end up equal height across the row — the flex item is the cell, not the card itself. */}
      <div className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2">
        {Children.map(children, (child) => (
          <div className="w-64 shrink-0 snap-start">{child}</div>
        ))}
      </div>
    </section>
  );
}
