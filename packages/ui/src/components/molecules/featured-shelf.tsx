import type * as React from 'react';
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
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [&>*]:w-64 [&>*]:shrink-0 [&>*]:snap-start">
        {children}
      </div>
    </section>
  );
}
