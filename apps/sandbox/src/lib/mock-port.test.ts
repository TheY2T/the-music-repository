import { describe, expect, it } from 'vitest';
import { mockPort } from './mock-port';

const HOOK_NAMES = [
  'useSearchCatalogue',
  'useSearchCollections',
  'useGetHealth',
  'useGetRelatedContent',
  'useGetContentBySlug',
  'useGetCollectionWithProgress',
  'useListCollectionsForContent',
] as const;

describe('mock data-access port', () => {
  it('implements every ApiDataPort hook', () => {
    for (const name of HOOK_NAMES) {
      expect(typeof (mockPort as Record<string, unknown>)[name]).toBe('function');
    }
  });

  it('returns already-resolved react-query results (no live API needed)', () => {
    const result = mockPort.useGetHealth() as {
      isLoading: boolean;
      isError: boolean;
      data: unknown;
    };
    expect(result.isLoading).toBe(false);
    expect(result.isError).toBe(false);
    expect(result.data).toBeDefined();
  });

  it('reports a healthy API for HealthCard', () => {
    const result = mockPort.useGetHealth() as { data: { data: { checks: { database: string } } } };
    expect(result.data.data.checks.database).toBe('up');
  });

  it('returns empty, well-shaped catalogue + collection results', () => {
    const cat = mockPort.useSearchCatalogue({}) as {
      data: { data: { items: unknown[]; facets: object } };
    };
    expect(cat.data.data.items).toEqual([]);
    expect(cat.data.data.facets).toBeTypeOf('object');

    const cols = mockPort.useSearchCollections({}) as { data: { data: { items: unknown[] } } };
    expect(cols.data.data.items).toEqual([]);
  });
});
