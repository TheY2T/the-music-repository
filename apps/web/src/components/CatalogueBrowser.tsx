import { ApiProvider, type SearchCatalogueType, useSearchCatalogue } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  type ActiveFilterItem,
  ActiveFilters,
  Badge,
  Button,
  CardGrid,
  Chip,
  cn,
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
import {
  clearRecents,
  getRecents,
  loadBrowseState,
  pushRecent,
  type RecentCatalogueItem,
  saveBrowseState,
  setLastSelected,
  takeLastSelected,
} from '@/lib/catalogue-history';
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
  // Browse memory: the previously-opened card (scroll target + highlight) and the recents strip.
  const [pendingScrollSlug, setPendingScrollSlug] = useState<string | null>(null);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentCatalogueItem[]>([]);

  useEffect(() => {
    if (showFavorites) {
      listFavoriteSlugs().then((slugs) => setFavorites(new Set(slugs)));
    }
  }, [showFavorites]);

  // Restore the last browse session (filters + page) and queue a scroll to the card that was open,
  // then load the recents strip. Runs once, post-hydration (storage is client-only), so no mismatch.
  useEffect(() => {
    const saved = loadBrowseState();
    if (saved) {
      setQ(saved.q);
      setGenre(saved.genre);
      setEra(saved.era);
      setInstrument(saved.instrument);
      setTopic(saved.topic);
      setType(saved.type);
      setPage(saved.page);
    }
    const slug = takeLastSelected();
    if (slug) setPendingScrollSlug(slug);
    setRecents(getRecents());
  }, []);

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

  // Once the restored page has loaded, scroll the previously-opened card into view and highlight it.
  // If it isn't on this page (filtered out since), give up quietly rather than scroll to nothing.
  useEffect(() => {
    if (!pendingScrollSlug || isFetching || items.length === 0) return;
    if (!items.some((i) => i.slug === pendingScrollSlug)) {
      setPendingScrollSlug(null);
      return;
    }
    const el = document.getElementById(`cat-item-${pendingScrollSlug}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightSlug(pendingScrollSlug);
    setPendingScrollSlug(null);
  }, [pendingScrollSlug, isFetching, items]);

  // The highlight is a brief cue — fade it out after a moment.
  useEffect(() => {
    if (!highlightSlug) return;
    const timer = setTimeout(() => setHighlightSlug(null), 2600);
    return () => clearTimeout(timer);
  }, [highlightSlug]);

  // Remember context when the user opens a card, so returning restores the list + scrolls to it.
  function onSelect(item: (typeof items)[number]) {
    saveBrowseState({ q, genre, era, instrument, topic, type, page });
    setLastSelected(item.slug);
    pushRecent({
      slug: item.slug,
      title: item.title,
      type: item.type,
      difficulty: item.difficulty,
    });
  }

  function onClearRecents() {
    clearRecents();
    setRecents([]);
  }

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
        {recents.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Icon name="clock" className="size-4 text-muted-foreground" />
                {t(locale, 'catalogue.recentlyViewed')}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={onClearRecents}
              >
                {t(locale, 'catalogue.recentsClear')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recents.map((r) => (
                <a
                  key={r.slug}
                  href={localizedPath(locale, `/catalogue/${r.slug}`)}
                  onClick={() => setLastSelected(r.slug)}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Chip variant="muted" interactive>
                    {r.title}
                  </Chip>
                </a>
              ))}
            </div>
          </div>
        ) : null}

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
              // biome-ignore lint/a11y/useKeyWithClickEvents: passive recorder — the real control is the nested card <a> (keyboard-accessible), whose Enter-activation bubbles a click here too.
              <li
                key={item.slug}
                id={`cat-item-${item.slug}`}
                onClick={(e) => {
                  // Record context only for a navigation click (the card link), not the favorite heart.
                  if ((e.target as HTMLElement).closest('a[href]')) onSelect(item);
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
