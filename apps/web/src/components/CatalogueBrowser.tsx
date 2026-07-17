import { ApiProvider, type SearchCatalogueType, useSearchCatalogue } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  type ActiveFilterItem,
  ActiveFilters,
  Badge,
  CardGrid,
  cn,
  EmptyState,
  type FacetGroup,
  FacetPanel,
  Icon,
  MediaCard,
  Pagination,
  SearchField,
  Select,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import FavoriteHeart from '@/components/FavoriteHeart';
import RecentlyViewedStrip from '@/components/RecentlyViewedStrip';
import { useBrowseHistory } from '@/lib/browse-history';
import {
  bandCount,
  bandRange,
  type CatalogueGridFilters,
  LEVEL_BANDS,
  LEVEL_LABEL,
} from '@/lib/catalogue-shelves';
import { listFavoriteSlugs } from '@/lib/favorites-api';

/** Result ordering (mirrors the API's `CatalogueSort`). `relevance` sends no `sort` param. */
export type CatalogueSort = 'relevance' | 'difficulty-asc' | 'difficulty-desc' | 'title-asc';
const SORTS: CatalogueSort[] = ['relevance', 'difficulty-asc', 'difficulty-desc', 'title-asc'];
const SORT_LABEL: Record<CatalogueSort, MessageKey> = {
  relevance: 'catalogue.sort.relevance',
  'difficulty-asc': 'catalogue.sort.difficultyAsc',
  'difficulty-desc': 'catalogue.sort.difficultyDesc',
  'title-asc': 'catalogue.sort.titleAsc',
};

export type { CatalogueGridFilters };

interface CatalogueBrowseState {
  q: string;
  genre: string[];
  era: string[];
  instrument: string[];
  topic: string[];
  type?: string;
  level?: string;
  sort: CatalogueSort;
  page: number;
}

const PAGE_SIZE = 24;
const SKELETON_KEYS = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6'];

/** Localized label for a premium tier (`premium`/`pro`/`institution`; unknown → premium). */
function tierLabel(locale: Locale, tier?: string): string {
  const key: MessageKey =
    tier === 'pro' ? 'tier.pro' : tier === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CatalogueGrid({
  showFavorites,
  locale,
  initialFilters,
}: {
  showFavorites: boolean;
  locale: Locale;
  initialFilters?: CatalogueGridFilters;
}) {
  const [q, setQ] = useState(initialFilters?.q ?? '');
  const [genre, setGenre] = useState<string[]>(initialFilters?.genre ?? []);
  const [era, setEra] = useState<string[]>(initialFilters?.era ?? []);
  const [instrument, setInstrument] = useState<string[]>(initialFilters?.instrument ?? []);
  const [topic, setTopic] = useState<string[]>(initialFilters?.topic ?? []);
  const [type, setType] = useState<string | undefined>(initialFilters?.type);
  const [level, setLevel] = useState<string | undefined>(initialFilters?.level);
  const [sort, setSort] = useState<CatalogueSort>('relevance');
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

  const band = bandRange(level);
  const { data, isFetching } = useSearchCatalogue({
    q: q || undefined,
    genre,
    era,
    instrument,
    topic,
    type: type as SearchCatalogueType | undefined,
    difficultyMin: band?.min,
    difficultyMax: band?.max,
    sort: sort === 'relevance' ? undefined : sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { recents, highlightSlug, domId, recordSelect, clearRecents } =
    useBrowseHistory<CatalogueBrowseState>({
      namespace: 'catalogue',
      itemSlugs: items.map((i) => i.slug),
      ready: !isFetching,
      getState: () => ({ q, genre, era, instrument, topic, type, level, sort, page }),
      applyState: (s) => {
        setQ(s.q);
        setGenre(s.genre);
        setEra(s.era);
        setInstrument(s.instrument);
        setTopic(s.topic);
        setType(s.type);
        setLevel(s.level);
        setSort(s.sort ?? 'relevance');
        setPage(s.page);
      },
    });

  // Aggregate the per-grade difficulty distribution into band counts for the level facet.
  const levelOptions = LEVEL_BANDS.map((b) => ({
    value: b.key,
    label: t(locale, LEVEL_LABEL[b.key]),
    count: bandCount(result?.facets.difficulties, b),
    selected: level === b.key,
  }));

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
      key: 'level',
      label: t(locale, 'catalogue.facetLevel'),
      options: levelOptions,
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
    else if (groupKey === 'level') setLevel((cur) => (cur === value ? undefined : value));
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
  if (level) {
    activeFilters.push({
      key: `level:${level}`,
      label: labelFor('level', level),
      onRemove: () => {
        setLevel(undefined);
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
    setLevel(undefined);
    setGenre([]);
    setEra([]);
    setInstrument([]);
    setTopic([]);
    setQ('');
    setPage(1);
  }

  const hasActive = activeFilters.length > 0;

  return (
    <div className="space-y-6">
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
          <RecentlyViewedStrip
            title={t(locale, 'common.recentlyViewed')}
            clearLabel={t(locale, 'common.recentsClear')}
            items={recents.map((r) => ({
              slug: r.slug,
              title: r.title,
              href: localizedPath(locale, `/catalogue/${r.slug}`),
            }))}
            onClear={clearRecents}
            onSelect={(slug) =>
              recordSelect(recents.find((r) => r.slug === slug) ?? { slug, title: slug })
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isFetching
                ? t(locale, 'catalogue.searching')
                : t(locale, 'catalogue.results', { count: total })}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {t(locale, 'catalogue.sortLabel')}
              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as CatalogueSort);
                  setPage(1);
                }}
                className="w-auto"
              >
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(locale, SORT_LABEL[s])}
                  </option>
                ))}
              </Select>
            </label>
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
              {SKELETON_KEYS.map((key) => (
                <li key={key} className="space-y-3 rounded-lg border border-border p-0">
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
                // biome-ignore lint/a11y/useKeyWithClickEvents: passive recorder — the real control is the nested card <a> (keyboard-accessible), whose Enter-activation bubbles a click here too.
                <li
                  key={item.slug}
                  id={domId(item.slug)}
                  onClick={(e) => {
                    // Record context only for a navigation click (the card link), not the favorite heart.
                    if ((e.target as HTMLElement).closest('a[href]'))
                      recordSelect({
                        slug: item.slug,
                        title: item.title,
                        type: item.type,
                        difficulty: item.difficulty,
                      });
                  }}
                  className={cn(
                    'scroll-mt-24 rounded-lg transition-shadow',
                    highlightSlug === item.slug &&
                      'ring-2 ring-ring ring-offset-2 ring-offset-background',
                  )}
                >
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
      <CatalogueGrid showFavorites={showFavorites} locale={locale} />
    </ApiProvider>
  );
}
