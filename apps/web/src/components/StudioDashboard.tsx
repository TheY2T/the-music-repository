import { ApiProvider, type ContentSummary, useGetRelatedContent } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  buttonVariants,
  cn,
  EmptyState,
  FeaturedShelf,
  Icon,
  MediaCard,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import FavoriteHeart from '@/components/FavoriteHeart';
import { createBrowseHistory, type RecentItem } from '@/lib/browse-history';
import { listFavorites } from '@/lib/favorites-api';

function Dashboard({ locale, showFavorites }: { locale: Locale; showFavorites: boolean }) {
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [saved, setSaved] = useState<ContentSummary[] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Client-only: recents live in localStorage; favorites need the credentialed API.
  useEffect(() => {
    setRecents(createBrowseHistory('catalogue').getRecents());
    if (showFavorites) {
      listFavorites().then((items) => {
        setSaved(items);
        setFavorites(new Set(items.map((i) => i.slug)));
      });
    } else {
      setSaved([]);
    }
  }, [showFavorites]);

  function onFavoriteChange(slug: string, next: boolean) {
    setFavorites((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(slug);
      else updated.delete(slug);
      return updated;
    });
  }

  const topRecent = recents[0];
  const { data: relatedData } = useGetRelatedContent(topRecent?.slug ?? '', {
    query: { enabled: !!topRecent },
  });
  const recentSlugs = new Set(recents.map((r) => r.slug));
  const related = (relatedData?.data?.items ?? []).filter((i) => !recentSlugs.has(i.slug));

  // Still loading favorites → show a skeleton row rather than a premature empty state.
  if (saved === null) {
    return (
      <FeaturedShelf title={t(locale, 'dashboard.continue')}>
        {['sk1', 'sk2', 'sk3', 'sk4'].map((key) => (
          <div key={key} className="space-y-3 rounded-lg border border-border">
            <Skeleton className="aspect-[4/3] w-full rounded-b-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </FeaturedShelf>
    );
  }

  if (recents.length === 0 && saved.length === 0 && related.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="library" className="size-6" />}
        title={t(locale, 'dashboard.emptyTitle')}
        description={t(locale, 'dashboard.emptyDesc')}
        action={
          <a
            href={localizedPath(locale, '/catalogue')}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Icon name="library" className="size-4" />
            {t(locale, 'nav.catalogue')}
          </a>
        }
      />
    );
  }

  const summaryCard = (item: ContentSummary) => (
    <MediaCard
      key={item.slug}
      title={item.title}
      href={localizedPath(locale, `/catalogue/${item.slug}`)}
      summary={item.summary ?? undefined}
      typeLabel={item.type}
      difficultyLabel={
        item.difficulty ? t(locale, 'catalogue.grade', { level: item.difficulty }) : undefined
      }
      seed={item.slug}
      tags={[...item.genres, ...item.instruments].map((r) => r.name)}
      badgeSlot={
        item.locked ? (
          <Badge variant="warning">
            <Icon name="lock" className="size-3" />
          </Badge>
        ) : undefined
      }
      actionSlot={
        showFavorites ? (
          <FavoriteHeart
            slug={item.slug}
            favorited={favorites.has(item.slug)}
            onChange={onFavoriteChange}
          />
        ) : undefined
      }
    />
  );

  return (
    <div className="space-y-10">
      {recents.length > 0 ? (
        <FeaturedShelf title={t(locale, 'dashboard.continue')}>
          {recents.map((r) => (
            <MediaCard
              key={r.slug}
              title={r.title}
              href={localizedPath(locale, `/catalogue/${r.slug}`)}
              typeLabel={r.type}
              difficultyLabel={
                r.difficulty ? t(locale, 'catalogue.grade', { level: r.difficulty }) : undefined
              }
              seed={r.slug}
            />
          ))}
        </FeaturedShelf>
      ) : null}

      {topRecent && related.length > 0 ? (
        <FeaturedShelf title={t(locale, 'dashboard.recommended', { title: topRecent.title })}>
          {related.map(summaryCard)}
        </FeaturedShelf>
      ) : null}

      {saved.length > 0 ? (
        <FeaturedShelf title={t(locale, 'dashboard.saved')}>{saved.map(summaryCard)}</FeaturedShelf>
      ) : null}
    </div>
  );
}

/** The signed-in learner dashboard (ADR 0031) at `/dashboard` — continue / recommended / saved.
 * Self-contained (own ApiProvider); the page guards auth + the `learning.dashboard` flag. */
export default function StudioDashboard({
  locale,
  showFavorites = false,
}: {
  locale: Locale;
  showFavorites?: boolean;
}) {
  return (
    <ApiProvider>
      <Dashboard locale={locale} showFavorites={showFavorites} />
    </ApiProvider>
  );
}
