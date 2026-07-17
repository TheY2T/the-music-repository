import type * as React from 'react';
import { Children, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

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
 *
 * When the row overflows, edge **scroll buttons** appear (right, and left once scrolled) to page through
 * it. They are decorative mouse conveniences (`aria-hidden`, not tabbable): the row is already keyboard-
 * accessible because tabbing to an off-screen card scrolls it into view.
 */
export function FeaturedShelf({ title, action, children, className }: FeaturedShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const childCount = Children.count(children);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setAtStart(el.scrollLeft <= 1);
      setAtEnd(el.scrollWidth - el.clientWidth - el.scrollLeft <= 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
    // Re-measure when the child set changes (e.g. a search filters the shelf).
  }, [childCount]);

  const page = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const arrowClass =
    'absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition hover:text-foreground sm:flex';

  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="relative">
        {/* Wrap each child in a fixed-width cell that stretches to the tallest, so cards (with `h-full`)
            end up equal height across the row — the flex item is the cell, not the card itself. */}
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2"
        >
          {Children.map(children, (child) => (
            <div className="w-64 shrink-0 snap-start">{child}</div>
          ))}
        </div>
        {!atStart ? (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => page(-1)}
            className={cn(arrowClass, 'left-1')}
          >
            <Icon name="chevron-left" className="size-4" />
          </button>
        ) : null}
        {!atEnd ? (
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => page(1)}
            className={cn(arrowClass, 'right-1')}
          >
            <Icon name="chevron-right" className="size-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
