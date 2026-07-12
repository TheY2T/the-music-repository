import { ApiProvider, type CollectionSummary, useListCollections } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Badge, CardGrid } from '@TheY2T/tmr-ui';

function List({ locale }: { locale: Locale }) {
  const { data, isLoading } = useListCollections();
  const items: CollectionSummary[] = data?.status === 200 ? data.data.items : [];

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'collections.empty')}</p>;
  }
  return (
    <CardGrid>
      {items.map((collection) => (
        <li key={collection.slug}>
          <a
            href={localizedPath(locale, `/collections/${collection.slug}`)}
            className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {collection.kind}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {collection.itemCount}{' '}
                {t(
                  locale,
                  collection.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther',
                )}
              </span>
            </div>
            <h2 className="font-semibold leading-snug">{collection.title}</h2>
            {collection.summary ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{collection.summary}</p>
            ) : null}
          </a>
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
