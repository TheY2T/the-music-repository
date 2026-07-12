import type * as React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional back link rendered above the title. The label carries its own affordance (e.g. "← Home"). */
  back?: { href: string; label: React.ReactNode };
  /** Right-aligned actions (buttons, links). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page/section heading (back-link + title + subtitle + actions) for React islands.
 * `.astro` pages use the `PageShell` Astro component instead; this mirrors it for interactive
 * islands that render their own heading.
 */
export function PageHeader({ title, subtitle, back, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-1', className)}>
      {back ? (
        <a href={back.href} className="text-sm text-muted-foreground hover:text-foreground">
          {back.label}
        </a>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
