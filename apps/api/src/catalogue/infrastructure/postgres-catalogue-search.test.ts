import { describe, expect, it } from 'vitest';
import type { ContentRepository } from '../application/ports/content-repository.port';
import type { CatalogueQuery, ContentItem } from '../domain/content-item';
import { PostgresCatalogueSearch } from './postgres-catalogue-search.adapter';

function item(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: overrides.slug ?? 'id',
    slug: 'slug',
    title: 'Untitled',
    summary: null,
    bodyMdx: null,
    type: 'lesson',
    visibility: 'public',
    tier: null,
    status: 'published',
    difficulty: null,
    source: null,
    attribution: null,
    license: null,
    details: null,
    bodyDoc: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    genres: [],
    instruments: [],
    topics: [],
    tags: [],
    media: [],
    ...overrides,
  };
}

function query(overrides: Partial<CatalogueQuery> = {}): CatalogueQuery {
  return {
    genres: [],
    instruments: [],
    topics: [],
    eras: [],
    composers: [],
    keys: [],
    page: 1,
    pageSize: 20,
    ...overrides,
  };
}

function searchOver(items: ContentItem[]): PostgresCatalogueSearch {
  const repository = { findAllPublished: async () => items } as unknown as ContentRepository;
  return new PostgresCatalogueSearch(repository);
}

describe('PostgresCatalogueSearch', () => {
  it('returns everything with empty facets when unfiltered', async () => {
    const search = searchOver([
      item({ slug: 'a', title: 'Alpha', genres: [{ slug: 'jazz', name: 'Jazz' }] }),
      item({ slug: 'b', title: 'Beta', genres: [{ slug: 'jazz', name: 'Jazz' }] }),
    ]);
    const result = await search.search(query());
    expect(result.total).toBe(2);
    expect(result.facets.genres).toEqual([{ value: 'jazz', label: 'Jazz', count: 2 }]);
  });

  it('filters by taxonomy slug (per-facet OR)', async () => {
    const search = searchOver([
      item({ slug: 'a', instruments: [{ slug: 'piano', name: 'Piano' }] }),
      item({ slug: 'b', instruments: [{ slug: 'guitar', name: 'Guitar' }] }),
    ]);
    const result = await search.search(query({ instruments: ['piano'] }));
    expect(result.items.map((i) => i.slug)).toEqual(['a']);
  });

  it('applies an inclusive difficulty range', async () => {
    const search = searchOver([
      item({ slug: 'easy', difficulty: 2 }),
      item({ slug: 'mid', difficulty: 5 }),
      item({ slug: 'hard', difficulty: 9 }),
    ]);
    const result = await search.search(query({ difficultyMin: 3, difficultyMax: 6 }));
    expect(result.items.map((i) => i.slug)).toEqual(['mid']);
  });

  it('derives era/composer/key facets from details', async () => {
    const search = searchOver([
      item({ slug: 'a', details: { era: 'Baroque', composer: 'Bach', key: 'D minor (opening)' } }),
      item({ slug: 'b', details: { era: 'Baroque', composer: 'Handel' } }),
    ]);
    const result = await search.search(query());
    expect(result.facets.eras).toEqual([{ value: 'Baroque', label: 'Baroque', count: 2 }]);
    expect(result.facets.keys).toEqual([{ value: 'D minor', label: 'D minor', count: 1 }]);
  });

  it('ranks q matches by field weight, dropping non-matches', async () => {
    const search = searchOver([
      item({ slug: 'title-hit', title: 'Blues scales' }),
      item({ slug: 'summary-hit', title: 'Something', summary: 'about blues' }),
      item({ slug: 'miss', title: 'Classical' }),
    ]);
    const result = await search.search(query({ q: 'blues' }));
    expect(result.items.map((i) => i.slug)).toEqual(['title-hit', 'summary-hit']);
  });

  it('sorts by difficulty ascending with nulls last', async () => {
    const search = searchOver([
      item({ slug: 'none', difficulty: null }),
      item({ slug: 'three', difficulty: 3 }),
      item({ slug: 'one', difficulty: 1 }),
    ]);
    const result = await search.search(query({ sort: 'difficulty-asc' }));
    expect(result.items.map((i) => i.slug)).toEqual(['one', 'three', 'none']);
  });

  it('paginates, keeping total as the full match count', async () => {
    const items = Array.from({ length: 5 }, (_, i) => item({ slug: `s${i}`, title: `T${i}` }));
    const search = searchOver(items);
    const result = await search.search(query({ sort: 'title-asc', page: 2, pageSize: 2 }));
    expect(result.total).toBe(5);
    expect(result.items.map((i) => i.slug)).toEqual(['s2', 's3']);
  });
});
