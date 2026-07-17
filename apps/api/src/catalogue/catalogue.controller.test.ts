import type { Client } from '@openfeature/server-sdk';
import { describe, expect, it, vi } from 'vitest';
import type { PremiumAccessService } from '../entitlements/application/premium-access.service';
import type { GetContentBySlugUseCase } from './application/use-cases/get-content-by-slug.use-case';
import type { GetRelatedContentUseCase } from './application/use-cases/get-related-content.use-case';
import type { SearchCatalogueUseCase } from './application/use-cases/search-catalogue.use-case';
import { CatalogueController } from './catalogue.controller';
import type { CatalogueQuery } from './domain/content-item';

/** Build a controller whose search use-case records the normalized query it receives.
 * Premium gating is flagged **off** (getBooleanValue → false) so `resolveViewerRank` short-circuits
 * to Infinity without touching PremiumAccessService. */
function makeController() {
  const execute = vi.fn().mockResolvedValue({
    items: [],
    facets: { genres: [], instruments: [], topics: [], eras: [], types: [], difficulties: [] },
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const flags = { getBooleanValue: vi.fn().mockResolvedValue(false) } as unknown as Client;
  const controller = new CatalogueController(
    { execute } as unknown as SearchCatalogueUseCase,
    {} as GetContentBySlugUseCase,
    {} as GetRelatedContentUseCase,
    {} as PremiumAccessService,
    flags,
  );
  return { controller, execute };
}

async function normalizedFrom(raw: Record<string, string | string[] | undefined>) {
  const { controller, execute } = makeController();
  await controller.search(raw);
  return execute.mock.calls[0]?.[0] as CatalogueQuery;
}

describe('CatalogueController query normalization', () => {
  it('parses difficultyMin/difficultyMax into a numeric range', async () => {
    const query = await normalizedFrom({ difficultyMin: '4', difficultyMax: '6' });
    expect(query.difficultyMin).toBe(4);
    expect(query.difficultyMax).toBe(6);
  });

  it('drops non-numeric difficulty bounds', async () => {
    const query = await normalizedFrom({ difficultyMin: '', difficultyMax: 'x' });
    expect(query.difficultyMin).toBeUndefined();
    expect(query.difficultyMax).toBeUndefined();
  });

  it('accepts a known sort and rejects an unknown one', async () => {
    expect((await normalizedFrom({ sort: 'difficulty-asc' })).sort).toBe('difficulty-asc');
    expect((await normalizedFrom({ sort: 'title-asc' })).sort).toBe('title-asc');
    expect((await normalizedFrom({ sort: 'bogus' })).sort).toBeUndefined();
    expect((await normalizedFrom({})).sort).toBeUndefined();
  });

  it('still drops empty array facets and clamps paging', async () => {
    const query = await normalizedFrom({ genre: ['', 'blues'], page: '0', pageSize: '500' });
    expect(query.genres).toEqual(['blues']);
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(100);
  });
});
