import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  type ActiveFilterItem,
  ActiveFilters,
  buttonVariants,
  CardGrid,
  cn,
  EmptyState,
  type FacetGroup,
  FacetPanel,
  Icon,
  Pagination,
  SearchField,
  Select,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useApiData } from '@TheY2T/tmr-web-acl/api-data';
import { useBrowseHistory } from '@TheY2T/tmr-web-acl/browse-history';
import { listSavedCollectionSlugs } from '@TheY2T/tmr-web-acl/collections-api';
import type { CollectionsFilters } from '@TheY2T/tmr-web-acl/collections-shelves';
import { getProgress } from '@TheY2T/tmr-web-acl/progress-api';
import { useEffect, useState } from 'react';
import CollectionCard from './CollectionCard';
import RecentlyViewedStrip from './RecentlyViewedStrip';
import SaveCollectionButton from './SaveCollectionButton';

const PAGE_SIZE = 24;
const SORTS = ['featured', 'newest', 'popular', 'az', 'difficulty'] as const;

interface CollectionsBrowseState {
  q: string;
  kind?: string;
  era: string[];
  instrument: string[];
  technique: string[];
  difficulty?: number;
  sort: (typeof SORTS)[number];
  page: number;
}
const SORT_LABEL: Record<(typeof SORTS)[number], MessageKey> = {
  featured: 'collections.sortFeatured',
  newest: 'collections.sortNewest',
  popular: 'collections.sortPopular',
  az: 'collections.sortAz',
  difficulty: 'collections.sortDifficulty',
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function durationLabel(locale: Locale, minutes?: number): string | undefined {
  if (!minutes) {
    return undefined;
  }
  return minutes >= 60
    ? t(locale, 'collections.durationHours', { hours: Math.round(minutes / 60) })
    : t(locale, 'collections.durationMinutes', { minutes });
}

export function CollectionsGrid({
  locale,
  showProgress,
  showSave,
  initialFilters,
  showFeatured = true,
}: {
  locale: Locale;
  showProgress: boolean;
  showSave: boolean;
  initialFilters?: CollectionsFilters;
  /** Whether to render the featured-collection banner when idle (the hub renders its own). */
  showFeatured?: boolean;
}) {
  const [q, setQ] = useState(initialFilters?.q ?? '');
  const [kind, setKind] = useState<string | undefined>(initialFilters?.kind);
  const [era, setEra] = useState<string[]>(initialFilters?.era ?? []);
  const [instrument, setInstrument] = useState<string[]>(initialFilters?.instrument ?? []);
  const [technique, setTechnique] = useState<string[]>(initialFilters?.technique ?? []);
  const [difficulty, setDifficulty] = useState<number | undefined>(initialFilters?.difficulty);
  const [sort, setSort] = useState<(typeof SORTS)[number]>('featured');
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (showSave) {
      listSavedCollectionSlugs().then((slugs) => setSaved(new Set(slugs)));
    }
  }, [showSave]);

  useEffect(() => {
    if (showProgress) {
      getProgress().then((summary) => {
        if (!summary) {
          return;
        }
        const map = new Map<string, number>();
        for (const c of summary.collections) {
          map.set(c.slug, c.totalItems ? Math.round((c.completedItems / c.totalItems) * 100) : 0);
        }
        setProgress(map);
      });
    }
  }, [showProgress]);

  const { useSearchCollections } = useApiData();
  const { data, isFetching } = useSearchCollections({
    q: q || undefined,
    kind,
    era,
    instrument,
    technique,
    difficulty,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const result = data?.data;
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { recents, highlightSlug, domId, recordSelect, clearRecents } =
    useBrowseHistory<CollectionsBrowseState>({
      namespace: 'collections',
      itemSlugs: items.map((c) => c.slug),
      ready: !isFetching,
      getState: () => ({ q, kind, era, instrument, technique, difficulty, sort, page }),
      applyState: (s) => {
        setQ(s.q);
        setKind(s.kind);
        setEra(s.era);
        setInstrument(s.instrument);
        setTechnique(s.technique);
        setDifficulty(s.difficulty);
        setSort(s.sort);
        setPage(s.page);
      },
    });

  const groups: FacetGroup[] = [
    {
      key: 'kind',
      label: t(locale, 'collections.facetKind'),
      options: (result?.facets.kinds ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: kind === f.value,
      })),
    },
    {
      key: 'difficulty',
      label: t(locale, 'collections.facetDifficulty'),
      options: (result?.facets.difficulties ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: difficulty === Number(f.value),
      })),
    },
    {
      key: 'era',
      label: t(locale, 'collections.facetEra'),
      options: (result?.facets.eras ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: era.includes(f.value),
      })),
    },
    {
      key: 'instrument',
      label: t(locale, 'collections.facetInstrument'),
      options: (result?.facets.instruments ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: instrument.includes(f.value),
      })),
    },
    {
      key: 'technique',
      label: t(locale, 'collections.facetTechnique'),
      options: (result?.facets.techniques ?? []).map((f) => ({
        value: f.value,
        label: f.label,
        count: f.count,
        selected: technique.includes(f.value),
      })),
    },
  ];

  function onToggleFacet(groupKey: string, value: string) {
    setPage(1);
    if (groupKey === 'kind') setKind((cur) => (cur === value ? undefined : value));
    else if (groupKey === 'difficulty')
      setDifficulty((cur) => (cur === Number(value) ? undefined : Number(value)));
    else if (groupKey === 'era') setEra((cur) => toggle(cur, value));
    else if (groupKey === 'instrument') setInstrument((cur) => toggle(cur, value));
    else if (groupKey === 'technique') setTechnique((cur) => toggle(cur, value));
  }

  const labelFor = (groupKey: string, value: string) =>
    groups.find((g) => g.key === groupKey)?.options.find((o) => o.value === value)?.label ?? value;

  const activeFilters: ActiveFilterItem[] = [];
  if (kind) {
    activeFilters.push({
      key: `kind:${kind}`,
      label: labelFor('kind', kind),
      onRemove: () => {
        setKind(undefined);
        setPage(1);
      },
    });
  }
  if (difficulty != null) {
    activeFilters.push({
      key: `difficulty:${difficulty}`,
      label: labelFor('difficulty', String(difficulty)),
      onRemove: () => {
        setDifficulty(undefined);
        setPage(1);
      },
    });
  }
  for (const [dim, values, setter] of [
    ['era', era, setEra],
    ['instrument', instrument, setInstrument],
    ['technique', technique, setTechnique],
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
    setKind(undefined);
    setDifficulty(undefined);
    setEra([]);
    setInstrument([]);
    setTechnique([]);
    setQ('');
    setPage(1);
  }

  const idle = !q && activeFilters.length === 0 && page === 1;
  const featured = idle ? items.find((c) => c.featured) : undefined;

  function card(c: (typeof items)[number]) {
    return (
      <CollectionCard
        href={localizedPath(locale, `/collections/${c.slug}`)}
        title={c.title}
        summary={c.summary ?? undefined}
        kindLabel={c.kind}
        seed={c.slug}
        featured={c.featured}
        featuredLabel={t(locale, 'collections.featuredBadge')}
        itemCountLabel={`${c.itemCount} ${t(locale, c.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther')}`}
        durationLabel={durationLabel(locale, c.estMinutes ?? undefined)}
        difficultyRangeLabel={
          c.difficultyMin != null
            ? t(locale, 'collections.difficultyRange', {
                min: c.difficultyMin,
                max: c.difficultyMax ?? c.difficultyMin,
              })
            : undefined
        }
        average={c.averageRating ?? undefined}
        ratingCount={c.ratingCount}
        progressPercent={showProgress ? progress.get(c.slug) : undefined}
        saveSlot={
          showSave ? (
            <SaveCollectionButton
              slug={c.slug}
              initialSaved={saved.has(c.slug)}
              labels={{
                save: t(locale, 'collections.save'),
                saved: t(locale, 'collections.saved'),
              }}
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {showFeatured && featured ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex flex-col gap-1">
            <p className="font-display text-xs font-semibold uppercase tracking-wider text-accent">
              {t(locale, 'collections.featuredBadge')}
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              {featured.title}
            </h1>
            {featured.summary ? (
              <p className="max-w-prose text-sm text-muted-foreground">{featured.summary}</p>
            ) : null}
          </div>
          <a
            href={localizedPath(locale, `/collections/${featured.slug}`)}
            className={cn(buttonVariants({ size: 'sm' }), 'shrink-0 self-start sm:self-auto')}
          >
            {t(locale, 'collections.startLearning')}
            <Icon name="arrow-right" className="size-4" />
          </a>
        </div>
      ) : null}

      <div className="grid gap-8 md:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <SearchField
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            onClear={() => {
              setQ('');
              setPage(1);
            }}
            placeholder={t(locale, 'collections.searchPlaceholder')}
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
              href: localizedPath(locale, `/collections/${r.slug}`),
            }))}
            onClear={clearRecents}
            onSelect={(slug) =>
              recordSelect(recents.find((r) => r.slug === slug) ?? { slug, title: slug })
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isFetching
                ? t(locale, 'collections.searching')
                : t(locale, 'collections.results', { count: total })}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              {t(locale, 'collections.sortLabel')}
              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as (typeof SORTS)[number]);
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

          {activeFilters.length > 0 ? (
            <ActiveFilters
              filters={activeFilters}
              onClear={clearAll}
              clearLabel={t(locale, 'collections.clearFilters')}
            />
          ) : null}

          {isFetching && items.length === 0 ? (
            <CardGrid>
              {['sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6'].map((key) => (
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
              icon={<Icon name="list-music" className="size-6" />}
              title={t(locale, 'collections.noResults')}
            />
          ) : (
            <CardGrid>
              {items.map((c) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: passive recorder — the real control is the nested card <a> (keyboard-accessible), whose Enter-activation bubbles a click here too.
                <li
                  key={c.slug}
                  id={domId(c.slug)}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a[href]'))
                      recordSelect({ slug: c.slug, title: c.title });
                  }}
                  className={cn(
                    'scroll-mt-24 rounded-lg transition-shadow',
                    highlightSlug === c.slug &&
                      'ring-2 ring-ring ring-offset-2 ring-offset-background',
                  )}
                >
                  {card(c)}
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

export default function CollectionsBrowser({
  locale,
  showProgress = false,
  showSave = false,
}: {
  locale: Locale;
  showProgress?: boolean;
  showSave?: boolean;
}) {
  return <CollectionsGrid locale={locale} showProgress={showProgress} showSave={showSave} />;
}
