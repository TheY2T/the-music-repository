import type { ContentSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  buttonVariants,
  CardGrid,
  cn,
  EmptyState,
  Icon,
  MediaCard,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { listFavorites } from '@/lib/favorites-api';

/** Localized label for a premium tier (`premium`/`pro`/`institution`; unknown → premium). */
function tierLabel(locale: Locale, tier?: string): string {
  const key: MessageKey =
    tier === 'pro' ? 'tier.pro' : tier === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

export default function MyFavorites({
  locale,
  showMonetization = false,
}: {
  locale: Locale;
  showMonetization?: boolean;
}) {
  const [items, setItems] = useState<ContentSummary[] | null>(null);

  useEffect(() => {
    listFavorites().then(setItems);
  }, []);

  if (!items) {
    return (
      <CardGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="space-y-3 rounded-lg border border-border p-0">
            <Skeleton className="aspect-[4/3] w-full rounded-b-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </li>
        ))}
      </CardGrid>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="heart" className="size-6" />}
        title={t(locale, 'myfav.emptyTitle')}
        description={t(locale, 'myfav.emptyDesc')}
        action={
          <a
            href={localizedPath(locale, '/catalogue')}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Icon name="library" className="size-4" />
            {t(locale, 'myfav.catalogue')}
          </a>
        }
      />
    );
  }

  return (
    <CardGrid>
      {items.map((item) => (
        <li key={item.slug}>
          <MediaCard
            title={item.title}
            href={localizedPath(locale, `/catalogue/${item.slug}`)}
            summary={item.summary ?? undefined}
            typeLabel={item.type}
            difficultyLabel={
              item.difficulty
                ? t(locale, 'myfav.grade', { difficulty: item.difficulty })
                : undefined
            }
            seed={item.slug}
            tags={[...item.genres, ...item.instruments].map((r) => r.name)}
            badgeSlot={
              item.locked && showMonetization ? (
                <Badge variant="warning">
                  <Icon name="lock" className="size-3" />
                  {tierLabel(locale, item.tier)}
                </Badge>
              ) : undefined
            }
          />
        </li>
      ))}
    </CardGrid>
  );
}
