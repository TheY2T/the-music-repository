import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Icon } from '@TheY2T/tmr-ui';
import { useApiData } from '@TheY2T/tmr-web-acl/api-data';

/**
 * Coursework widget — a compact list of featured collections (guided courses / learning paths) linking
 * into the catalogue. Reads live data through the injected data-access port, so it renders inside the
 * builder's `ApiDataProvider`. i18n-by-prop.
 */
export default function CollectionsWidget({ locale }: { locale: Locale }) {
  const { useSearchCollections } = useApiData();
  const { data, isFetching } = useSearchCollections({ sort: 'featured', page: 1, pageSize: 12 });
  const items = data?.data?.items ?? [];

  if (isFetching && items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'common.loading')}</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'spaces.collections.empty')}</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((c) => (
        <li key={c.slug}>
          <a
            href={localizedPath(locale, `/collections/${c.slug}`)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <Icon name="graduation-cap" className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-foreground">{c.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{c.itemCount}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
