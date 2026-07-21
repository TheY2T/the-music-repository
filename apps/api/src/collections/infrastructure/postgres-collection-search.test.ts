import { describe, expect, it } from 'vitest';
import type { CollectionRatings } from '../application/ports/collection-ratings.port';
import type { CollectionRepository } from '../application/ports/collection-repository.port';
import type { Collection, CollectionRatingAggregate } from '../domain/collection';
import type { CollectionSearchQuery } from '../domain/collection-search';
import { PostgresCollectionSearch } from './postgres-collection-search.adapter';

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: overrides.slug ?? 'id',
    slug: 'slug',
    title: 'Untitled',
    summary: null,
    bodyMdx: null,
    kind: 'course',
    visibility: 'public',
    status: 'published',
    curationType: 'editorial',
    ownerId: null,
    heroImageKey: null,
    accent: null,
    featured: false,
    difficultyMin: null,
    difficultyMax: null,
    estMinutes: null,
    curatorName: null,
    curatorBio: null,
    outcomes: null,
    facets: null,
    tags: null,
    popularity: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    itemSlugs: [],
    sections: [],
    items: [],
    ...overrides,
  };
}

function query(overrides: Partial<CollectionSearchQuery> = {}): CollectionSearchQuery {
  return {
    eras: [],
    instruments: [],
    techniques: [],
    moods: [],
    curators: [],
    sort: 'featured',
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

function searchOver(
  collections: Collection[],
  ratings: Record<string, CollectionRatingAggregate> = {},
): PostgresCollectionSearch {
  const repository = {
    findAllPublished: async () => collections,
  } as unknown as CollectionRepository;
  const ratingsPort = {
    getAggregate: async (slugs: string[]) =>
      new Map(slugs.filter((s) => ratings[s]).map((s) => [s, ratings[s]])),
  } as unknown as CollectionRatings;
  return new PostgresCollectionSearch(repository, ratingsPort);
}

describe('PostgresCollectionSearch', () => {
  it('excludes private collections from discovery', async () => {
    const search = searchOver([
      collection({ slug: 'pub', visibility: 'public' }),
      collection({ slug: 'priv', visibility: 'private' }),
    ]);
    const result = await search.search(query());
    expect(result.items.map((c) => c.slug)).toEqual(['pub']);
  });

  it('filters by a grade within the difficulty band', async () => {
    const search = searchOver([
      collection({ slug: 'beg', difficultyMin: 1, difficultyMax: 3 }),
      collection({ slug: 'adv', difficultyMin: 6, difficultyMax: 8 }),
    ]);
    const result = await search.search(query({ difficulty: 2 }));
    expect(result.items.map((c) => c.slug)).toEqual(['beg']);
  });

  it('builds facet counts over the facet arrays', async () => {
    const search = searchOver([
      collection({ slug: 'a', facets: { era: ['baroque'], mood: ['calm'] } }),
      collection({ slug: 'b', facets: { era: ['baroque'] } }),
    ]);
    const result = await search.search(query());
    expect(result.facets.eras).toEqual([{ value: 'baroque', label: 'Baroque', count: 2 }]);
    expect(result.facets.moods).toEqual([{ value: 'calm', label: 'Calm', count: 1 }]);
  });

  it('orders featured collections first, then by popularity', async () => {
    const search = searchOver([
      collection({ slug: 'plain', featured: false, popularity: 100 }),
      collection({ slug: 'star', featured: true, popularity: 1 }),
    ]);
    const result = await search.search(query({ sort: 'featured' }));
    expect(result.items.map((c) => c.slug)).toEqual(['star', 'plain']);
  });

  it('attaches rating aggregates to the results', async () => {
    const search = searchOver([collection({ slug: 'a' })], { a: { average: 4.5, count: 12 } });
    const result = await search.search(query());
    expect(result.items[0]?.averageRating).toBe(4.5);
    expect(result.items[0]?.ratingCount).toBe(12);
  });
});
