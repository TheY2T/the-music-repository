import { Injectable } from '@nestjs/common';
import { CatalogueSearch } from '../application/ports/catalogue-search.port';
import { ContentRepository } from '../application/ports/content-repository.port';
import {
  type CatalogueQuery,
  type CatalogueResult,
  type CatalogueSort,
  type ContentItem,
  type FacetValue,
  normalizeKey,
  slugToLabel,
  toContentSummaryView,
} from '../domain/content-item';

/**
 * Faceted catalogue search over Postgres. Reads the published set through `ContentRepository` and
 * applies filters, facets, sort, and pagination in memory — the same in-memory approach the related
 * endpoint uses, appropriate at the catalogue's scale. Filters combine as per-facet OR / across-facet
 * AND; facet counts are computed over the filtered set.
 */
@Injectable()
export class PostgresCatalogueSearch extends CatalogueSearch {
  constructor(private readonly repository: ContentRepository) {
    super();
  }

  async search(query: CatalogueQuery): Promise<CatalogueResult> {
    const published = await this.repository.findAllPublished();
    const matched = published
      .map((item) => ({ item, score: this.relevance(item, query.q) }))
      .filter(({ item, score }) => score >= 0 && this.matchesFilters(item, query));

    const facets = {
      genres: taxonomyFacet(matched, (i) => i.genres.map((g) => g.slug)),
      instruments: taxonomyFacet(matched, (i) => i.instruments.map((x) => x.slug)),
      topics: taxonomyFacet(matched, (i) => i.topics.map((t) => t.slug)),
      eras: valueFacet(matched, (i) => nonEmpty(i.details?.era)),
      types: labelFacet(matched, (i) => [i.type]),
      difficulties: difficultyFacet(matched, (i) => i.difficulty),
      composers: valueFacet(matched, (i) => nonEmpty(i.details?.composer)),
      keys: valueFacet(matched, (i) => nonEmpty(normalizeKey(i.details?.key))),
    };

    const ordered = matched.sort((a, b) => this.compare(a, b, query.sort));
    const offset = (query.page - 1) * query.pageSize;
    const items = ordered
      .slice(offset, offset + query.pageSize)
      .map(({ item }) => toContentSummaryView(item));

    return { items, facets, total: matched.length, page: query.page, pageSize: query.pageSize };
  }

  /** No index to maintain — search reads live from Postgres. */
  async indexAll(_items: ContentItem[]): Promise<void> {}

  /** A `q` relevance score (higher = better), or -1 when a non-empty `q` matches nothing.
   * Weights mirror the field importance of the previous engine: title > summary > taxonomy names. */
  private relevance(item: ContentItem, q: string | undefined): number {
    const needle = q?.trim().toLowerCase();
    if (!needle) {
      return 0;
    }
    const tokens = needle.split(/\s+/);
    const fields: [string, number][] = [
      [item.title, 4],
      [item.summary ?? '', 3],
      [item.genres.map((g) => g.name).join(' '), 2],
      [item.instruments.map((i) => i.name).join(' '), 2],
      [item.topics.map((t) => t.name).join(' '), 2],
    ];
    let score = 0;
    for (const [text, weight] of fields) {
      const haystack = text.toLowerCase();
      for (const token of tokens) {
        if (haystack.includes(token)) {
          score += weight;
        }
      }
    }
    return score > 0 ? score : -1;
  }

  private matchesFilters(item: ContentItem, query: CatalogueQuery): boolean {
    if (!['public', 'authed', 'premium'].includes(item.visibility)) {
      return false;
    }
    if (query.type && item.type !== query.type) {
      return false;
    }
    if (query.difficulty != null && item.difficulty !== query.difficulty) {
      return false;
    }
    if (
      query.difficultyMin != null &&
      (item.difficulty == null || item.difficulty < query.difficultyMin)
    ) {
      return false;
    }
    if (
      query.difficultyMax != null &&
      (item.difficulty == null || item.difficulty > query.difficultyMax)
    ) {
      return false;
    }
    const era = nonEmpty(item.details?.era);
    const composer = nonEmpty(item.details?.composer);
    const key = nonEmpty(normalizeKey(item.details?.key));
    return (
      orMatch(
        query.genres,
        item.genres.map((g) => g.slug),
      ) &&
      orMatch(
        query.instruments,
        item.instruments.map((i) => i.slug),
      ) &&
      orMatch(
        query.topics,
        item.topics.map((t) => t.slug),
      ) &&
      orMatch(query.eras, era ? [era] : []) &&
      orMatch(query.composers, composer ? [composer] : []) &&
      orMatch(query.keys, key ? [key] : [])
    );
  }

  private compare(
    a: { item: ContentItem; score: number },
    b: { item: ContentItem; score: number },
    sort: CatalogueSort | undefined,
  ): number {
    switch (sort) {
      case 'difficulty-asc':
        return nullsLast(a.item.difficulty, b.item.difficulty, 1);
      case 'difficulty-desc':
        return nullsLast(a.item.difficulty, b.item.difficulty, -1);
      case 'title-asc':
        return a.item.title.localeCompare(b.item.title);
      default:
        // Relevance: best text score first, then a stable alphabetical tiebreak.
        return b.score - a.score || a.item.title.localeCompare(b.item.title);
    }
  }
}

type Scored = { item: ContentItem };

/** True when `selected` is empty (no filter) or shares at least one value with `values` (OR). */
function orMatch(selected: string[], values: string[]): boolean {
  return selected.length === 0 || selected.some((s) => values.includes(s));
}

function nonEmpty(value: string | null | undefined): string | null {
  return value?.trim() ? value : null;
}

/** Order two nullable numbers, always sorting nulls last; `dir` is 1 for asc, -1 for desc. */
function nullsLast(a: number | null, b: number | null, dir: number): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  return (a - b) * dir;
}

function tally(entries: Scored[], values: (item: ContentItem) => string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { item } of entries) {
    for (const value of values(item)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

/** Facet keyed by taxonomy slug, labelled from the slug, ordered by count desc. */
function taxonomyFacet(entries: Scored[], values: (item: ContentItem) => string[]): FacetValue[] {
  return [...tally(entries, values)]
    .map(([value, count]) => ({ value, label: slugToLabel(value), count }))
    .sort((a, b) => b.count - a.count);
}

/** Facet whose value is already a display string (era/composer/key), ordered by count desc. */
function valueFacet(entries: Scored[], value: (item: ContentItem) => string | null): FacetValue[] {
  return [
    ...tally(entries, (item) => {
      const v = value(item);
      return v ? [v] : [];
    }),
  ]
    .map(([v, count]) => ({ value: v, label: v, count }))
    .sort((a, b) => b.count - a.count);
}

/** Facet labelled from the slug (type), ordered by count desc. */
function labelFacet(entries: Scored[], values: (item: ContentItem) => string[]): FacetValue[] {
  return taxonomyFacet(entries, values);
}

function difficultyFacet(
  entries: Scored[],
  value: (item: ContentItem) => number | null,
): FacetValue[] {
  return [
    ...tally(entries, (item) => {
      const d = value(item);
      return d != null ? [String(d)] : [];
    }),
  ]
    .map(([v, count]) => ({ value: v, label: `Grade ${v}`, count }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}
