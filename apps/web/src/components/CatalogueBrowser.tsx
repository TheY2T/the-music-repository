import {
  ApiProvider,
  type FacetValue,
  type SearchCatalogueType,
  useSearchCatalogue,
} from '@TheY2T/tmr-api-client';
import { useEffect, useState } from 'react';
import FavoriteHeart from '@/components/FavoriteHeart';
import { listFavoriteSlugs } from '@/lib/favorites-api';

/** Human label for a premium tier (`premium`/`pro`/`institution`). */
function tierLabel(tier?: string): string {
  if (!tier) {
    return 'Premium';
  }
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FacetGroup({
  title,
  facets,
  selected,
  onToggle,
}: {
  title: string;
  facets: FacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (!facets.length) {
    return null;
  }
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1">
        {facets.map((facet) => (
          <li key={facet.value}>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(facet.value)}
                onChange={() => onToggle(facet.value)}
              />
              <span>{facet.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{facet.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Browser({ showFavorites }: { showFavorites: boolean }) {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [instrument, setInstrument] = useState<string[]>([]);
  const [topic, setTopic] = useState<string[]>([]);
  const [type, setType] = useState<string | undefined>();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showFavorites) {
      listFavoriteSlugs().then((slugs) => setFavorites(new Set(slugs)));
    }
  }, [showFavorites]);

  function onFavoriteChange(slug: string, next: boolean) {
    setFavorites((prev) => {
      const updated = new Set(prev);
      if (next) {
        updated.add(slug);
      } else {
        updated.delete(slug);
      }
      return updated;
    });
  }

  const { data, isFetching } = useSearchCatalogue({
    q: q || undefined,
    genre,
    instrument,
    topic,
    type: type as SearchCatalogueType | undefined,
    pageSize: 24,
  });
  const result = data?.data;

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <FacetGroup
          title="Type"
          facets={result?.facets.types ?? []}
          selected={type ? [type] : []}
          onToggle={(value) => setType((current) => (current === value ? undefined : value))}
        />
        <FacetGroup
          title="Genre"
          facets={result?.facets.genres ?? []}
          selected={genre}
          onToggle={(value) => setGenre((current) => toggle(current, value))}
        />
        <FacetGroup
          title="Instrument"
          facets={result?.facets.instruments ?? []}
          selected={instrument}
          onToggle={(value) => setInstrument((current) => toggle(current, value))}
        />
        <FacetGroup
          title="Topic"
          facets={result?.facets.topics ?? []}
          selected={topic}
          onToggle={(value) => setTopic((current) => toggle(current, value))}
        />
      </aside>

      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isFetching ? 'Searching…' : `${result?.total ?? 0} results`}
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(result?.items ?? []).map((item) => (
            <li key={item.slug} className="relative">
              {showFavorites ? (
                <div className="absolute right-3 top-3 z-10">
                  <FavoriteHeart
                    slug={item.slug}
                    favorited={favorites.has(item.slug)}
                    onChange={onFavoriteChange}
                  />
                </div>
              ) : null}
              <a
                href={`/catalogue/${item.slug}`}
                className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {item.type}
                  </span>
                  {item.difficulty ? (
                    <span className="text-xs text-muted-foreground">Grade {item.difficulty}</span>
                  ) : null}
                  {item.locked ? (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      🔒 {tierLabel(item.tier)}
                    </span>
                  ) : null}
                </div>
                <h2 className="font-semibold leading-snug">{item.title}</h2>
                {item.summary ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-1 pt-2">
                  {[...item.genres, ...item.instruments].map((ref) => (
                    <span
                      key={ref.slug}
                      className="rounded-full border border-border px-2 py-0.5 text-xs"
                    >
                      {ref.name}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function CatalogueBrowser({ showFavorites = false }: { showFavorites?: boolean }) {
  return (
    <ApiProvider>
      <Browser showFavorites={showFavorites} />
    </ApiProvider>
  );
}
