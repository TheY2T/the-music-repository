import { Injectable } from '@nestjs/common';
import { slugToLabel } from '../../catalogue/domain/content-item';
import { CollectionRatings } from '../application/ports/collection-ratings.port';
import { CollectionRepository } from '../application/ports/collection-repository.port';
import { CollectionSearchIndex } from '../application/ports/collection-search.port';
import {
  type Collection,
  type CollectionRatingAggregate,
  toCollectionSummaryView,
} from '../domain/collection';
import type {
  CollectionFacetValue,
  CollectionSearchQuery,
  CollectionSearchResult,
  CollectionSort,
} from '../domain/collection-search';

/**
 * Faceted collections discovery over Postgres. Reads the published, non-private set through
 * `CollectionRepository` (with rating aggregates) and applies filters, facets, sort, and pagination in
 * memory. Filters combine as per-facet OR / across-facet AND; facet counts cover the filtered set.
 */
@Injectable()
export class PostgresCollectionSearch extends CollectionSearchIndex {
  constructor(
    private readonly repository: CollectionRepository,
    private readonly ratings: CollectionRatings,
  ) {
    super();
  }

  async search(query: CollectionSearchQuery): Promise<CollectionSearchResult> {
    const discoverable = (await this.repository.findAllPublished()).filter(
      (c) => c.visibility === 'public' || c.visibility === 'authed',
    );
    const aggregate = await this.ratings.getAggregate(discoverable.map((c) => c.slug));

    const matched = discoverable.filter(
      (c) => this.matchesText(c, query.q) && this.matchesFilters(c, query),
    );

    const facets = {
      kinds: labelFacet(matched, (c) => [c.kind]),
      eras: labelFacet(matched, (c) => c.facets?.era ?? []),
      instruments: labelFacet(matched, (c) => c.facets?.instrument ?? []),
      techniques: labelFacet(matched, (c) => c.facets?.technique ?? []),
      moods: labelFacet(matched, (c) => c.facets?.mood ?? []),
      curators: labelFacet(matched, (c) => (c.curatorName ? [c.curatorName] : [])),
      difficulties: difficultyFacet(matched),
    };

    const ordered = [...matched].sort((a, b) => compare(a, b, query.sort));
    const offset = (query.page - 1) * query.pageSize;
    const items = ordered
      .slice(offset, offset + query.pageSize)
      .map((c) => toCollectionSummaryView(c, aggregate.get(c.slug)));

    return { items, facets, total: matched.length, page: query.page, pageSize: query.pageSize };
  }

  /** No index to maintain — discovery reads live from Postgres. */
  async indexAll(
    _collections: Collection[],
    _ratings: Map<string, CollectionRatingAggregate>,
  ): Promise<void> {}

  private matchesText(c: Collection, q: string | undefined): boolean {
    const needle = q?.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    const haystack = [c.title, c.summary ?? '', c.curatorName ?? '', ...(c.tags ?? [])]
      .join(' ')
      .toLowerCase();
    return needle.split(/\s+/).some((token) => haystack.includes(token));
  }

  private matchesFilters(c: Collection, query: CollectionSearchQuery): boolean {
    if (query.kind && c.kind !== query.kind) {
      return false;
    }
    if (query.difficulty != null && !gradeInRange(c, query.difficulty)) {
      return false;
    }
    if (query.featured && !c.featured) {
      return false;
    }
    return (
      orMatch(query.eras, c.facets?.era ?? []) &&
      orMatch(query.instruments, c.facets?.instrument ?? []) &&
      orMatch(query.techniques, c.facets?.technique ?? []) &&
      orMatch(query.moods, c.facets?.mood ?? []) &&
      orMatch(query.curators, c.curatorName ? [c.curatorName] : [])
    );
  }
}

/** True when the collection's difficulty band [min..max] contains `grade`. */
function gradeInRange(c: Collection, grade: number): boolean {
  if (c.difficultyMin == null) {
    return false;
  }
  return grade >= c.difficultyMin && grade <= (c.difficultyMax ?? c.difficultyMin);
}

function orMatch(selected: string[], values: string[]): boolean {
  return selected.length === 0 || selected.some((s) => values.includes(s));
}

function compare(a: Collection, b: Collection, sort: CollectionSort): number {
  switch (sort) {
    case 'newest':
      return b.createdAt.getTime() - a.createdAt.getTime();
    case 'popular':
      return b.popularity - a.popularity;
    case 'az':
      return a.title.localeCompare(b.title);
    case 'difficulty':
      return nullsLast(a.difficultyMin, b.difficultyMin);
    default:
      // featured: featured first, then most popular.
      return Number(b.featured) - Number(a.featured) || b.popularity - a.popularity;
  }
}

function nullsLast(a: number | null, b: number | null): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  return a - b;
}

function tally(
  collections: Collection[],
  values: (c: Collection) => string[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of collections) {
    for (const value of values(c)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

function labelFacet(
  collections: Collection[],
  values: (c: Collection) => string[],
): CollectionFacetValue[] {
  return [...tally(collections, values)]
    .map(([value, count]) => ({ value, label: slugToLabel(value), count }))
    .sort((a, b) => b.count - a.count);
}

/** Difficulty facet over the expanded grade band of each collection, ordered by grade asc. */
function difficultyFacet(collections: Collection[]): CollectionFacetValue[] {
  const counts = tally(collections, (c) => {
    if (c.difficultyMin == null) {
      return [];
    }
    const max = c.difficultyMax ?? c.difficultyMin;
    const grades: string[] = [];
    for (let g = c.difficultyMin; g <= max; g++) {
      grades.push(String(g));
    }
    return grades;
  });
  return [...counts]
    .map(([value, count]) => ({ value, label: `Grade ${value}`, count }))
    .sort((a, b) => Number(a.value) - Number(b.value));
}
