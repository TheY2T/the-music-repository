import type * as React from 'react';
import { cn } from '../../lib/utils';

export interface HeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  /** Row of actions (buttons / links). */
  actions?: React.ReactNode;
  /** Optional visual on the right (image, cover collage). Two-col on md+, stacked on mobile. */
  media?: React.ReactNode;
  className?: string;
}

/** Landing hero band: eyebrow + large display title + subtitle + actions, with optional right-side media. */
export function Hero({ eyebrow, title, subtitle, actions, media, className }: HeroProps) {
  return (
    <section
      className={cn(
        'grid items-center gap-8 rounded-lg px-6 py-12 md:px-10 md:py-16',
        media && 'md:grid-cols-2',
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        {eyebrow ? (
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        {subtitle ? <p className="max-w-prose text-lg text-muted-foreground">{subtitle}</p> : null}
        {actions ? <div className="mt-2 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {media ? <div className="min-w-0">{media}</div> : null}
    </section>
  );
}
