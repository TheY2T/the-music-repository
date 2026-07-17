import {
  ApiProvider,
  type SearchCatalogueType,
  useSearchCatalogue,
  useSearchCollections,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  Button,
  buttonVariants,
  FeaturedShelf,
  Icon,
  MediaCard,
  SegmentedToggle,
  Skeleton,
} from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { CatalogueGrid } from '@/components/CatalogueBrowser';
import CollectionCard from '@/components/CollectionCard';
import FavoriteHeart from '@/components/FavoriteHeart';
import {
  AXES,
  AXIS_LABEL,
  type AxisKey,
  buildShelves,
  type CatalogueGridFilters,
  filtersToParams,
  type HubFacets,
  type ShelfConfig,
} from '@/lib/catalogue-shelves';
import { listFavoriteSlugs } from '@/lib/favorites-api';

const SHELF_CARDS = 12;

/** One horizontally-scrolling shelf. Self-fetches; renders nothing when its bucket is empty so
 * a re-sliced axis never shows dead rows. */
function CatalogueShelf({
  config,
  locale,
  showFavorites,
  favorites,
  onFavoriteChange,
  onSeeAll,
  seeAllLabel,
}: {
  config: ShelfConfig;
  locale: Locale;
  showFavorites: boolean;
  favorites: Set<string>;
  onFavoriteChange: (slug: string, next: boolean) => void;
  onSeeAll: () => void;
  seeAllLabel: string;
}) {
  const params = filtersToParams(config.filters);
  const { data, isFetching } = useSearchCatalogue({
    ...params,
    type: params.type as SearchCatalogueType | undefined,
    page: 1,
    pageSize: SHELF_CARDS,
  });
  const result = data?.data;
  const items = result?.items ?? [];

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
      {items.map((item) => (
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
      ))}
    </FeaturedShelf>
  );
}

function ShelfSkeleton({ title }: { title: string }) {
  return (
    <FeaturedShelf title={title}>
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

/** A "See all →" that links out to a full page (collections / tools live on their own routes). */
function SeeAllLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
      {label}
      <Icon name="arrow-right" className="size-4" />
    </a>
  );
}

function durationLabel(locale: Locale, minutes: number | undefined): string | undefined {
  if (minutes == null) return undefined;
  return minutes >= 60
    ? t(locale, 'collections.durationHours', { hours: Math.round(minutes / 60) })
    : t(locale, 'collections.durationMinutes', { minutes });
}

/** Federated shelf of guided collections (a separate Meili index) — the "guided paths" layer.
 * Hidden when the collections feature is off or the index is empty. */
function CollectionsShelf({ locale }: { locale: Locale }) {
  const { data, isFetching } = useSearchCollections({ sort: 'featured', page: 1, pageSize: 12 });
  const items = data?.data?.items ?? [];
  const title = t(locale, 'catalogue.hub.shelfCollections');

  if (isFetching && items.length === 0) return <ShelfSkeleton title={title} />;
  if (items.length === 0) return null;

  return (
    <FeaturedShelf
      title={title}
      action={
        <SeeAllLink
          href={localizedPath(locale, '/collections')}
          label={t(locale, 'catalogue.hub.seeAll')}
        />
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

/** A flagship interactive tool surfaced on the hub. Enabled-state is resolved server-side (page). */
export interface HubTool {
  slug: string;
  title: string;
  summary?: string;
}

/** Shelf of curated interactive tools. Tools live on `/tools/*`, not the catalogue index. */
function ToolsShelf({ tools, locale }: { tools: HubTool[]; locale: Locale }) {
  return (
    <FeaturedShelf
      title={t(locale, 'catalogue.hub.shelfTools')}
      action={
        <SeeAllLink
          href={localizedPath(locale, '/tools')}
          label={t(locale, 'catalogue.hub.seeAll')}
        />
      }
    >
      {tools.map((tool) => (
        <MediaCard
          key={tool.slug}
          title={tool.title}
          href={localizedPath(locale, `/tools/${tool.slug}`)}
          summary={tool.summary}
          typeLabel={t(locale, 'catalogue.hub.toolLabel')}
          seed={tool.slug}
        />
      ))}
    </FeaturedShelf>
  );
}

const AXIS_STORE_KEY = 'tmr.catalogue.hubAxis';

function isAxis(value: string | null): value is AxisKey {
  return (AXES as readonly string[]).includes(value ?? '');
}

/** The last-chosen axis for this session, so returning to the hub without a `?by=` keeps it. */
function storedAxis(): AxisKey | null {
  try {
    const value = sessionStorage.getItem(AXIS_STORE_KEY);
    return isAxis(value) ? value : null;
  } catch {
    return null;
  }
}

function persistAxis(axis: AxisKey): void {
  try {
    sessionStorage.setItem(AXIS_STORE_KEY, axis);
  } catch {
    /* storage unavailable — axis memory is best-effort */
  }
}

/** Seed the axis from the URL (`?by=`) first, then session memory, then the default. */
function readInitialAxis(): AxisKey {
  if (typeof window === 'undefined') return 'instrument';
  const by = new URLSearchParams(window.location.search).get('by');
  if (isAxis(by)) return by;
  return storedAxis() ?? 'instrument';
}

function Hub({
  showFavorites,
  showCollections,
  tools,
  locale,
}: {
  showFavorites: boolean;
  showCollections: boolean;
  tools: HubTool[];
  locale: Locale;
}) {
  const [view, setView] = useState<'hub' | 'browse'>('hub');
  const [axis, setAxis] = useState<AxisKey>('instrument');
  const [browseFilters, setBrowseFilters] = useState<CatalogueGridFilters | undefined>(undefined);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Read deep-link state after mount (avoids a hydration mismatch vs. the SSR default render).
  useEffect(() => {
    setAxis(readInitialAxis());
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('view');
      if (v === 'browse') setView('browse');
    }
  }, []);

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

  function syncUrl(nextAxis: AxisKey, nextView: 'hub' | 'browse') {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('by', nextAxis);
    if (nextView === 'browse') params.set('view', 'browse');
    else params.delete('view');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }

  function changeAxis(next: AxisKey) {
    setAxis(next);
    persistAxis(next);
    syncUrl(next, view);
  }

  function openBrowse(filters?: CatalogueGridFilters) {
    setBrowseFilters(filters);
    setView('browse');
    syncUrl(axis, 'browse');
  }

  // Switch views without discarding the browse filters, so flicking Hub↔Browse keeps context.
  function selectView(next: 'hub' | 'browse') {
    setView(next);
    syncUrl(axis, next);
  }

  // Overview query — one lightweight call whose facet distributions drive the shelf list.
  const { data: overview } = useSearchCatalogue({ page: 1, pageSize: 1 });
  const facets = overview?.data?.facets as HubFacets | undefined;
  const shelves = buildShelves(axis, facets, locale);

  return (
    <div className="space-y-6">
      {/* Control bar — organise-by (hub only) on the left, the persistent view toggle on the right.
          Kept at the very top so the browsing controls sit above the fold. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === 'hub' ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t(locale, 'catalogue.hub.organiseBy')}
            </span>
            <SegmentedToggle<AxisKey>
              aria-label={t(locale, 'catalogue.hub.organiseBy')}
              value={axis}
              onValueChange={changeAxis}
              options={AXES.map((a) => ({ value: a, label: t(locale, AXIS_LABEL[a]) }))}
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
        <CatalogueGrid
          // Remount when the entry filters change so `useState` initializers re-seed.
          key={JSON.stringify(browseFilters ?? {})}
          showFavorites={showFavorites}
          locale={locale}
          initialFilters={browseFilters}
        />
      ) : (
        <>
          {/* Compact hero banner — a slim intro so shelves reach the fold. */}
          <div className="flex flex-col gap-3 rounded-lg bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex flex-col gap-1">
              <p className="font-display text-xs font-semibold uppercase tracking-wider text-accent">
                {t(locale, 'catalogue.hub.heroEyebrow')}
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {t(locale, 'catalogue.hub.heroTitle')}
              </h1>
              <p className="max-w-prose text-sm text-muted-foreground">
                {t(locale, 'catalogue.hub.heroSubtitle')}
              </p>
            </div>
            <Button
              className="shrink-0 self-start sm:self-auto"
              onClick={() => openBrowse(undefined)}
            >
              {t(locale, 'catalogue.hub.browseAll')}
              <Icon name="arrow-right" className="size-4" />
            </Button>
          </div>

          <div className="space-y-8">
            {shelves.map((config) => (
              <CatalogueShelf
                key={`${axis}:${config.key}`}
                config={config}
                locale={locale}
                showFavorites={showFavorites}
                favorites={favorites}
                onFavoriteChange={onFavoriteChange}
                onSeeAll={() => openBrowse(config.filters)}
                seeAllLabel={t(locale, 'catalogue.hub.seeAll')}
              />
            ))}

            {/* Evergreen cross-type shelves — collections (guided paths) + interactive tools. */}
            {showCollections ? <CollectionsShelf locale={locale} /> : null}
            {tools.length > 0 ? <ToolsShelf tools={tools} locale={locale} /> : null}
          </div>
        </>
      )}
    </div>
  );
}

export default function CatalogueHub({
  showFavorites = false,
  showCollections = false,
  tools = [],
  locale,
}: {
  showFavorites?: boolean;
  showCollections?: boolean;
  tools?: HubTool[];
  locale: Locale;
}) {
  return (
    <ApiProvider>
      <Hub
        showFavorites={showFavorites}
        showCollections={showCollections}
        tools={tools}
        locale={locale}
      />
    </ApiProvider>
  );
}
