import { Badge, Icon, MediaCard, Progress, StarRating } from '@TheY2T/tmr-ui';
import type * as React from 'react';

/**
 * Rich collection card for the discovery grid + shelves. Presentational (no hooks) so it is unit-
 * testable; composes the shared `MediaCard` with meta (duration · items), an optional progress bar +
 * rating footer, a featured badge, and a save-button action slot. i18n-by-prop.
 */
export interface CollectionCardProps {
  href: string;
  title: string;
  summary?: string;
  kindLabel: string;
  itemCountLabel: string;
  durationLabel?: string;
  difficultyRangeLabel?: string;
  seed: string;
  featured?: boolean;
  featuredLabel: string;
  average?: number;
  ratingCount?: number;
  progressPercent?: number;
  progressLabel?: string;
  saveSlot?: React.ReactNode;
}

export default function CollectionCard({
  href,
  title,
  summary,
  kindLabel,
  itemCountLabel,
  durationLabel,
  difficultyRangeLabel,
  seed,
  featured,
  featuredLabel,
  average,
  ratingCount,
  progressPercent,
  progressLabel,
  saveSlot,
}: CollectionCardProps) {
  const showRating = ratingCount != null && ratingCount > 0;
  const showProgress = progressPercent != null && progressPercent > 0;

  return (
    <MediaCard
      title={title}
      href={href}
      summary={summary}
      typeLabel={kindLabel}
      difficultyLabel={difficultyRangeLabel}
      seed={seed}
      badgeSlot={
        featured ? (
          <Badge variant="warning">
            <Icon name="sparkles" className="size-3" />
            {featuredLabel}
          </Badge>
        ) : undefined
      }
      actionSlot={saveSlot}
      metaSlot={
        <>
          <span className="inline-flex items-center gap-1">
            <Icon name="list-music" className="size-3.5" />
            {itemCountLabel}
          </span>
          {durationLabel ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="size-3.5" />
              {durationLabel}
            </span>
          ) : null}
        </>
      }
      footerSlot={
        showProgress || showRating ? (
          <div className="flex flex-col gap-2">
            {showProgress ? (
              <div className="flex items-center gap-2">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {progressLabel ?? `${progressPercent}%`}
                </span>
              </div>
            ) : null}
            {showRating ? (
              <StarRating value={average ?? 0} count={ratingCount} readOnly size="sm" />
            ) : null}
          </div>
        ) : undefined
      }
    />
  );
}
