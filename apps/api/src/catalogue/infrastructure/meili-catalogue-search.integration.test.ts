import type { ConfigService } from '@nestjs/config';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ContentRepository } from '../application/ports/content-repository.port';
import type { ContentItem } from '../domain/content-item';
import { MeiliCatalogueSearch } from './meili-catalogue-search.adapter';

// Integration: a real Meilisearch via Testcontainers, indexed with sample items, then queried to prove
// typo-tolerant search + facet distribution. Requires a Docker/podman socket (opt-in via
// `test:integration`). See ADR 0020/0055 · docs/features/testing.md.
const MASTER_KEY = 'test-master-key';

function item(overrides: Partial<ContentItem>): ContentItem {
  return {
    id: overrides.slug ?? 'id',
    slug: 'slug',
    title: 'Title',
    summary: null,
    type: 'lesson',
    visibility: 'public',
    tier: null,
    difficulty: null,
    details: null,
    genres: [],
    instruments: [],
    topics: [],
    ...overrides,
  } as ContentItem;
}

describe('MeiliCatalogueSearch (Testcontainers Meilisearch)', () => {
  let container: StartedTestContainer;
  let adapter: MeiliCatalogueSearch;

  beforeAll(async () => {
    container = await new GenericContainer('getmeili/meilisearch:v1.12')
      .withEnvironment({ MEILI_MASTER_KEY: MASTER_KEY, MEILI_ENV: 'development' })
      .withExposedPorts(7700)
      .withWaitStrategy(Wait.forHttp('/health', 7700))
      .start();

    const host = `http://${container.getHost()}:${container.getMappedPort(7700)}`;
    const env: Record<string, string> = {
      MEILI_HOST: host,
      MEILI_API_KEY: MASTER_KEY,
      MEILI_INDEX_PREFIX: 'test',
    };
    const config = { get: (k: string) => env[k] } as unknown as ConfigService;
    adapter = new MeiliCatalogueSearch(config, {} as ContentRepository);

    await adapter.indexAll([
      item({
        id: '1',
        slug: 'moonlight-sonata',
        title: 'Moonlight Sonata',
        type: 'score',
        difficulty: 6,
        details: { era: 'Classical', composer: 'Beethoven' },
        genres: [{ slug: 'classical', name: 'Classical' }],
      }),
      item({
        id: '2',
        slug: 'blues-shuffle',
        title: 'Blues Shuffle',
        type: 'lesson',
        difficulty: 3,
        genres: [{ slug: 'blues', name: 'Blues' }],
      }),
    ]);
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  const baseQuery = {
    genres: [] as string[],
    instruments: [] as string[],
    topics: [] as string[],
    eras: [] as string[],
    composers: [] as string[],
    keys: [] as string[],
    page: 1,
    pageSize: 10,
    sort: 'relevance' as const,
  };

  it('finds a document despite a typo in the query', async () => {
    // "sonta" is a single-typo (one deletion) of "sonata" — within Meilisearch's typo budget.
    const result = await adapter.search({ ...baseQuery, q: 'sonta' });
    expect(result.items.map((i) => i.slug)).toContain('moonlight-sonata');
  });

  it('returns facet distributions with labels', async () => {
    const result = await adapter.search({ ...baseQuery });
    expect(result.total).toBe(2);
    const genreValues = result.facets.genres.map((f) => f.value).sort();
    expect(genreValues).toEqual(['blues', 'classical']);
    expect(result.facets.difficulties).toEqual(
      expect.arrayContaining([{ value: '3', label: 'Grade 3', count: 1 }]),
    );
  });

  it('filters by facet (OR within, gate on visibility)', async () => {
    const result = await adapter.search({ ...baseQuery, genres: ['blues'] });
    expect(result.items.map((i) => i.slug)).toEqual(['blues-shuffle']);
  });
});
