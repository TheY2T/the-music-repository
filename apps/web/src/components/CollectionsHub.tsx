import { ApiProvider, useSearchCollections } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Button,
  buttonVariants,
  cn,
  FeaturedShelf,
  Icon,
  SegmentedToggle,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import CollectionCard from '@/components/CollectionCard';
import { CollectionsGrid } from '@/components/CollectionsBrowser';
import {
  buildCollectionShelves,
  COLLECTION_AXES,
  COLLECTION_AXIS_LABEL,
  type CollectionAxis,
  type CollectionHubFacets,
  type CollectionShelfConfig,
  type CollectionsFilters,
  collectionFiltersToParams,
} from '@/lib/collections-shelves';

const SHELF_CARDS = 12;

function durationLabel(locale: Locale, minutes: number | undefined): string | undefined {
  if (!minutes) return undefined;
  return minutes >= 60
    ? t(locale, 'collections.durationHours', { hours: Math.round(minutes / 60) })
    : t(locale, 'collections.durationMinutes', { minutes });
}

/** One horizontally-scrolling shelf of collections. Self-fetches; hidden when its bucket is empty. */
function CollectionShelf({
  config,
  locale,
  onSeeAll,
  seeAllLabel,
}: {
  config: CollectionShelfConfig;
  locale: Locale;
  onSeeAll: () => void;
  seeAllLabel: string;
}) {
  const { data, isFetching } = useSearchCollections({
    ...collectionFiltersToParams(config.filters),
    sort: 'featured',
    page: 1,
    pageSize: SHELF_CARDS,
  });
  const items = data?.data?.items ?? [];

  if (isFetching && items.length === 0) {
    return (
      <FeaturedShelf title={config.title}>
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

  if (items.length === 0) {
    return null;
  }

  return (
    <FeaturedShelf
      title={config.title}
      action={
        <Button variant="ghost" size="sm" onClick={onSeeAll}>
          {seeAllLabel}
          <Icon name="arrow-right" className="size-4" />
        </Button>
      }
    >
      {items.map((c) => (
        <CollectionCard
          key={c.slug}
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
        />
      ))}
    </FeaturedShelf>
  );
}

const AXIS_STORE_KEY = 'tmr.collections.hubAxis';

function isAxis(value: string | null): value is CollectionAxis {
  return (COLLECTION_AXES as readonly string[]).includes(value ?? '');
}

/** The last-chosen axis for this session, so returning to the hub without a `?by=` keeps it. */
function storedAxis(): CollectionAxis | null {
  try {
    const value = sessionStorage.getItem(AXIS_STORE_KEY);
    return isAxis(value) ? value : null;
  } catch {
    return null;
  }
}

function persistAxis(axis: CollectionAxis): void {
  try {
    sessionStorage.setItem(AXIS_STORE_KEY, axis);
  } catch {
    /* storage unavailable — axis memory is best-effort */
  }
}

/** Seed the axis from the URL (`?by=`) first, then session memory, then the default. */
function readInitialAxis(): CollectionAxis {
  if (typeof window === 'undefined') return 'kind';
  const by = new URLSearchParams(window.location.search).get('by');
  if (isAxis(by)) return by;
  return storedAxis() ?? 'kind';
}

function Hub({
  locale,
  showProgress,
  showSave,
}: {
  locale: Locale;
  showProgress: boolean;
  showSave: boolean;
}) {
  const [view, setView] = useState<'hub' | 'browse'>('hub');
  const [axis, setAxis] = useState<CollectionAxis>('kind');
  const [browseFilters, setBrowseFilters] = useState<CollectionsFilters | undefined>(undefined);

  useEffect(() => {
    setAxis(readInitialAxis());
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'browse') setView('browse');
    }
  }, []);

  function syncUrl(nextAxis: CollectionAxis, nextView: 'hub' | 'browse') {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('by', nextAxis);
    if (nextView === 'browse') params.set('view', 'browse');
    else params.delete('view');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }

  function changeAxis(next: CollectionAxis) {
    setAxis(next);
    persistAxis(next);
    syncUrl(next, view);
  }
  function selectView(next: 'hub' | 'browse') {
    setView(next);
    syncUrl(axis, next);
  }
  function openBrowse(filters?: CollectionsFilters) {
    setBrowseFilters(filters);
    setView('browse');
    syncUrl(axis, 'browse');
  }

  // Overview query — its facet distributions drive the shelves and its items provide the featured hero.
  const { data: overview } = useSearchCollections({ sort: 'featured', page: 1, pageSize: 12 });
  const facets = overview?.data?.facets as CollectionHubFacets | undefined;
  const featured = overview?.data?.items?.find((c) => c.featured);
  const shelves = buildCollectionShelves(axis, facets);

  return (
    <div className="space-y-6">
      {/* Control bar — organise-by (hub only) + the persistent view toggle. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === 'hub' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t(locale, 'catalogue.hub.organiseBy')}
            </span>
            <SegmentedToggle<CollectionAxis>
              aria-label={t(locale, 'catalogue.hub.organiseBy')}
              value={axis}
              onValueChange={changeAxis}
              options={COLLECTION_AXES.map((a) => ({
                value: a,
                label: t(locale, COLLECTION_AXIS_LABEL[a]),
              }))}
            />
          </div>
        ) : (
          <span />
        )}
        <SegmentedToggle<'hub' | 'browse'>
          aria-label={t(locale, 'catalogue.hub.viewHub')}
          value={view}
          onValueChange={selectView}
          options={[
            { value: 'hub', label: t(locale, 'catalogue.hub.viewHub') },
            { value: 'browse', label: t(locale, 'catalogue.hub.viewBrowse') },
          ]}
        />
      </div>

      {view === 'browse' ? (
        <CollectionsGrid
          key={JSON.stringify(browseFilters ?? {})}
          locale={locale}
          showProgress={showProgress}
          showSave={showSave}
          initialFilters={browseFilters}
          showFeatured={false}
        />
      ) : (
        <>
          {featured ? (
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

          <div className="space-y-8">
            {shelves.map((config) => (
              <CollectionShelf
                key={`${axis}:${config.key}`}
                config={config}
                locale={locale}
                onSeeAll={() => openBrowse(config.filters)}
                seeAllLabel={t(locale, 'catalogue.hub.seeAll')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CollectionsHub({
  locale,
  showProgress = false,
  showSave = false,
}: {
  locale: Locale;
  showProgress?: boolean;
  showSave?: boolean;
}) {
  return (
    <ApiProvider>
      <Hub locale={locale} showProgress={showProgress} showSave={showSave} />
    </ApiProvider>
  );
}
