import { describe, expect, it, vi } from 'vitest';
import type {
  CatalogueQuery,
  CatalogueResult,
  ContentSummaryView,
} from '../../domain/content-item';
import type { CatalogueSearch } from '../ports/catalogue-search.port';
import { SearchCatalogueUseCase } from './search-catalogue.use-case';

function summary(slug: string, over: Partial<ContentSummaryView> = {}): ContentSummaryView {
  return {
    slug,
    title: slug,
    type: 'song',
    visibility: 'public',
    genres: [],
    instruments: [],
    topics: [],
    ...over,
  };
}

const QUERY: CatalogueQuery = {
  genres: [],
  instruments: [],
  topics: [],
  page: 1,
  pageSize: 20,
};

function stubSearch(items: ContentSummaryView[]): CatalogueSearch {
  const result: CatalogueResult = {
    items,
    facets: { genres: [], instruments: [], topics: [], types: [], difficulties: [] },
    total: items.length,
    page: 1,
    pageSize: 20,
  };
  return { search: vi.fn().mockResolvedValue(result), indexAll: vi.fn() };
}

describe('SearchCatalogueUseCase (locked-preview gating)', () => {
  const items = [
    summary('free', { visibility: 'public' }),
    summary('prem', { visibility: 'premium', tier: 'premium' }),
    summary('pro', { visibility: 'premium', tier: 'pro' }),
  ];

  it("locks premium items above the viewer's rank (anonymous → rank 0)", async () => {
    const search = stubSearch(items);
    const result = await new SearchCatalogueUseCase(search).execute(QUERY, 0);
    const byslug = Object.fromEntries(result.items.map((i) => [i.slug, i]));
    expect(byslug.free?.locked).toBe(false);
    expect(byslug.prem?.locked).toBe(true);
    expect(byslug.pro?.locked).toBe(true);
    expect(search.search).toHaveBeenCalledWith(QUERY);
  });

  it('a premium entitlement (rank 1) unlocks premium but not pro', async () => {
    const result = await new SearchCatalogueUseCase(stubSearch(items)).execute(QUERY, 1);
    const byslug = Object.fromEntries(result.items.map((i) => [i.slug, i]));
    expect(byslug.prem?.locked).toBe(false);
    expect(byslug.pro?.locked).toBe(true);
  });

  it('staff / gating-off (rank Infinity) unlocks everything', async () => {
    const result = await new SearchCatalogueUseCase(stubSearch(items)).execute(
      QUERY,
      Number.POSITIVE_INFINITY,
    );
    expect(result.items.every((i) => i.locked === false)).toBe(true);
  });
});
