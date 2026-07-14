import type * as React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Chip } from './chip';
import { CoverArt } from './cover-art';

export interface MediaCardProps {
  title: string;
  href: string;
  summary?: string;
  typeLabel?: string;
  difficultyLabel?: string;
  tags?: string[];
  /** Cover-art seed; defaults to `href` for stable per-item art. */
  seed?: string;
  /** Rendered over the cover's top-right (e.g. a premium lock). Sits above the link overlay. */
  badgeSlot?: React.ReactNode;
  /** Rendered at the body's top-right (e.g. a favorite/save toggle). Sits above the link overlay. */
  actionSlot?: React.ReactNode;
  /** Small meta line under the badges (e.g. duration · item count). Presentational. */
  metaSlot?: React.ReactNode;
  /** Rendered at the card's foot (e.g. a progress bar + rating). Sits above the link overlay. */
  footerSlot?: React.ReactNode;
  className?: string;
}

/**
 * Catalogue/shelf card: procedural cover + type badge + title + summary + tag chips, wrapped as a
 * single link with a subtle hover lift. The anchor is an absolutely-positioned overlay so interactive
 * `badgeSlot`/`actionSlot` can sit above it without triggering navigation. Presentational, i18n-by-prop.
 */
export function MediaCard({
  title,
  href,
  summary,
  typeLabel,
  difficultyLabel,
  tags,
  seed,
  badgeSlot,
  actionSlot,
  metaSlot,
  footerSlot,
  className,
}: MediaCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      {/* Whole-card link as an overlay; slots below opt back in via higher z-index. */}
      <a
        href={href}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="sr-only">{title}</span>
      </a>

      <div className="relative border-b border-border">
        <CoverArt title={title} seed={seed ?? href} showLabel={false} />
        {badgeSlot ? <div className="absolute right-2 top-2 z-20">{badgeSlot}</div> : null}
      </div>

      <div className="relative flex flex-col gap-2 p-4">
        {actionSlot ? <div className="absolute right-3 top-3 z-20">{actionSlot}</div> : null}

        {typeLabel || difficultyLabel ? (
          <div className="flex items-center gap-2">
            {typeLabel ? <Badge variant="secondary">{typeLabel}</Badge> : null}
            {difficultyLabel ? (
              <span className="text-xs text-muted-foreground">{difficultyLabel}</span>
            ) : null}
          </div>
        ) : null}

        <h3 className="pr-8 font-display text-base font-semibold leading-tight text-foreground">
          {title}
        </h3>

        {metaSlot ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">{metaSlot}</div>
        ) : null}

        {summary ? <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p> : null}

        {tags && tags.length > 0 ? (
          <div className="relative z-20 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Chip key={tag} variant="muted">
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}

        {footerSlot ? <div className="relative z-20 mt-1">{footerSlot}</div> : null}
      </div>
    </Card>
  );
}
