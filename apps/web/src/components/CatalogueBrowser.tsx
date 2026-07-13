import { ApiProvider, type SearchCatalogueType, useSearchCatalogue } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  type ActiveFilterItem,
  ActiveFilters,
  Badge,
  CardGrid,
  EmptyState,
  type FacetGroup,
  FacetPanel,
  Icon,
  MediaCard,
  Pagination,
  SearchField,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import FavoriteHeart from '@/components/FavoriteHeart';
import { listFavoriteSlugs } from '@/lib/favorites-api';

const PAGE_SIZE = 24;

/** Localized label for a premium tier (`premium`/`pro`/`institution`; unknown → premium). */
function tierLabel(locale: Locale, tier?: string): string {
  const key: MessageKey =
    tier === 'pro' ? 'tier.pro' : tier === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Browser({ showFavorites, locale }: { showFavorites: boolean; locale: Locale }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [era, setEra] = useState<string[]>([]);
  const [instrument, setInstrument] = useState<string[]>([]);
  const [topic, setTopic] = useState<string[]>([]);
  const [type, setType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showFavorites) {
      listFavoriteSlugs().then((slugs) => setFavorites(new Set(slugs)));
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

  const { data, isFetching } = useSearchCatalogue({
    q: q || undefined,
    genre,
    era,
    instrument,
    topic,
    type: type as SearchCatalogueType | undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const groups: FacetGroup[] = [
    {
      key: 'type',
      label: t(locale, 'catalogue.facetType'),
      options: (result?.facets.types ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: type === f.value,
      })),
    },
    {
      key: 'genre',
      label: t(locale, 'catalogue.facetGenre'),
      options: (result?.facets.genres ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: genre.includes(f.value),
      })),
    },
    {
      key: 'era',
      label: t(locale, 'catalogue.facetEra'),
      options: (result?.facets.eras ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: era.includes(f.value),
      })),
    },
    {
      key: 'instrument',
      label: t(locale, 'catalogue.facetInstrument'),
      options: (result?.facets.instruments ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: instrument.includes(f.value),
      })),
    },
    {
      key: 'topic',
      label: t(locale, 'catalogue.facetTopic'),
      options: (result?.facets.topics ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: topic.includes(f.value),
      })),
    },
  ];

  function onToggleFacet(groupKey: string, value: string) {
    setPage(1);
    if (groupKey === 'type') setType((cur) => (cur === value ? undefined : value));
    else if (groupKey === 'genre') setGenre((cur) => toggle(cur, value));
    else if (groupKey === 'era') setEra((cur) => toggle(cur, value));
    else if (groupKey === 'instrument') setInstrument((cur) => toggle(cur, value));
    else if (groupKey === 'topic') setTopic((cur) => toggle(cur, value));
  }

  // Active-filter chips: look each selected value up in its facet group for the display label.
  const labelFor = (groupKey: string, value: string) =>
    groups.find((g) => g.key === groupKey)?.options.find((o) => o.value === value)?.label ?? value;

  const activeFilters: ActiveFilterItem[] = [];
  if (type) {
    activeFilters.push({
      key: `type:${type}`,
      label: labelFor('type', type),
      onRemove: () => {
        setType(undefined);
        setPage(1);
      },
    });
  }
  for (const [dim, values, setter] of [
    ['genre', genre, setGenre],
    ['era', era, setEra],
    ['instrument', instrument, setInstrument],
    ['topic', topic, setTopic],
  ] as const) {
    for (const value of values) {
      activeFilters.push({
        key: `${dim}:${value}`,
        label: labelFor(dim, value),
        onRemove: () => {
          setter((cur) => cur.filter((v) => v !== value));
          setPage(1);
        },
      });
    }
  }

  function clearAll() {
    setType(undefined);
    setGenre([]);
    setEra([]);
    setInstrument([]);
    setTopic([]);
    setQ('');
    setPage(1);
  }

  const hasActive = activeFilters.length > 0;

  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr]">
      <aside className="space-y-6">
        <SearchField
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          onClear={() => {
            setQ('');
            setPage(1);
          }}
          placeholder={t(locale, 'catalogue.search')}
        />
        <FacetPanel groups={groups} onToggle={onToggleFacet} />
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {isFetching
              ? t(locale, 'catalogue.searching')
              : t(locale, 'catalogue.results', { count: total })}
          </p>
        </div>

        {hasActive ? (
          <ActiveFilters
            filters={activeFilters}
            onClear={clearAll}
            clearLabel={t(locale, 'catalogue.clearFilters')}
          />
        ) : null}

        {isFetching && items.length === 0 ? (
          <CardGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton placeholders.
              <li key={i} className="space-y-3 rounded-lg border border-border p-0">
                <Skeleton className="aspect-[4/3] w-full rounded-b-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </li>
            ))}
          </CardGrid>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" className="size-6" />}
            title={t(locale, 'catalogue.emptyTitle')}
            description={t(locale, 'catalogue.emptyDesc')}
          />
        ) : (
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
                      ? t(locale, 'catalogue.grade', { level: item.difficulty })
                      : undefined
                  }
                  seed={item.slug}
                  tags={[...item.genres, ...item.instruments].map((r) => r.name)}
                  badgeSlot={
                    item.locked ? (
                      <Badge variant="warning">
                        <Icon name="lock" className="size-3" />
                        {tierLabel(locale, item.tier)}
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
              </li>
            ))}
          </CardGrid>
        )}

        {pageCount > 1 ? (
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            prevLabel={t(locale, 'common.prev')}
            nextLabel={t(locale, 'common.next')}
          />
        ) : null}
      </section>
    </div>
  );
}

export default function CatalogueBrowser({
  showFavorites = false,
  locale,
}: {
  showFavorites?: boolean;
  locale: Locale;
}) {
  return (
    <ApiProvider>
      <Browser showFavorites={showFavorites} locale={locale} />
    </ApiProvider>
  );
}
