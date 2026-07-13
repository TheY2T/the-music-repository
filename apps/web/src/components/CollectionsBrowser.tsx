import { ApiProvider, type CollectionSummary, useListCollections } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { CardGrid, EmptyState, Icon, MediaCard, Skeleton } from '@TheY2T/tmr-ui';

function List({ locale }: { locale: Locale }) {
  const { data, isLoading } = useListCollections();
  const items: CollectionSummary[] = data?.status === 200 ? data.data.items : [];

  if (isLoading) {
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
  if (!items.length) {
    return (
      <EmptyState
        icon={<Icon name="list-music" className="size-6" />}
        title={t(locale, 'collections.empty')}
      />
    );
  }
  return (
    <CardGrid>
      {items.map((collection) => (
        <li key={collection.slug}>
          <MediaCard
            title={collection.title}
            href={localizedPath(locale, `/collections/${collection.slug}`)}
            summary={collection.summary ?? undefined}
            typeLabel={collection.kind}
            difficultyLabel={`${collection.itemCount} ${t(
              locale,
              collection.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther',
            )}`}
            seed={collection.slug}
          />
        </li>
      ))}
    </CardGrid>
  );
}

export default function CollectionsBrowser({ locale }: { locale: Locale }) {
  return (
    <ApiProvider>
      <List locale={locale} />
    </ApiProvider>
  );
}
