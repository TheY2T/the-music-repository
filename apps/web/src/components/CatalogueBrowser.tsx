import {
  ApiProvider,
  type FacetValue,
  type SearchCatalogueType,
  useSearchCatalogue,
} from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Badge, CardGrid, Chip, SearchField } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import FavoriteHeart from '@/components/FavoriteHeart';
import { listFavoriteSlugs } from '@/lib/favorites-api';

/** Localized label for a premium tier (`premium`/`pro`/`institution`; unknown → premium). */
function tierLabel(locale: Locale, tier?: string): string {
  const key: MessageKey =
    tier === 'pro' ? 'tier.pro' : tier === 'institution' ? 'tier.institution' : 'tier.premium';
  return t(locale, key);
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

function Browser({ showFavorites, locale }: { showFavorites: boolean; locale: Locale }) {
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
        <SearchField
          value={q}
          onChange={(event) => setQ(event.target.value)}
          onClear={() => setQ('')}
          placeholder={t(locale, 'catalogue.search')}
        />
        <FacetGroup
          title={t(locale, 'catalogue.facetType')}
          facets={result?.facets.types ?? []}
          selected={type ? [type] : []}
          onToggle={(value) => setType((current) => (current === value ? undefined : value))}
        />
        <FacetGroup
          title={t(locale, 'catalogue.facetGenre')}
          facets={result?.facets.genres ?? []}
          selected={genre}
          onToggle={(value) => setGenre((current) => toggle(current, value))}
        />
        <FacetGroup
          title={t(locale, 'catalogue.facetInstrument')}
          facets={result?.facets.instruments ?? []}
          selected={instrument}
          onToggle={(value) => setInstrument((current) => toggle(current, value))}
        />
        <FacetGroup
          title={t(locale, 'catalogue.facetTopic')}
          facets={result?.facets.topics ?? []}
          selected={topic}
          onToggle={(value) => setTopic((current) => toggle(current, value))}
        />
      </aside>

      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isFetching
            ? t(locale, 'catalogue.searching')
            : t(locale, 'catalogue.results', { count: result?.total ?? 0 })}
        </p>
        <CardGrid>
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
                href={localizedPath(locale, `/catalogue/${item.slug}`)}
                className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {item.type}
                  </Badge>
                  {item.difficulty ? (
                    <span className="text-xs text-muted-foreground">
                      {t(locale, 'catalogue.grade', { level: item.difficulty })}
                    </span>
                  ) : null}
                  {item.locked ? (
                    <Badge variant="warning">🔒 {tierLabel(locale, item.tier)}</Badge>
                  ) : null}
                </div>
                <h2 className="font-semibold leading-snug">{item.title}</h2>
                {item.summary ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-1 pt-2">
                  {[...item.genres, ...item.instruments].map((ref) => (
                    <Chip key={ref.slug}>{ref.name}</Chip>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </CardGrid>
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
