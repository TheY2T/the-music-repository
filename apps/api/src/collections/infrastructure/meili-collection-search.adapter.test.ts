import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { Collection, CollectionRatingAggregate } from '../domain/collection';
import type { CollectionSearchQuery } from '../domain/collection-search';

/** Args of a recorded mock call (throws if the call was never made) — keeps strict index access happy. */
function argsOf(mock: Mock, callIndex = 0): unknown[] {
  const call = mock.mock.calls[callIndex];
  if (!call) throw new Error(`expected mock call #${callIndex}`);
  return call as unknown[];
}

const searchMock = vi.fn();
const updateSettingsMock = vi.fn();
const deleteAllMock = vi.fn();
const addDocumentsMock = vi.fn();
const waitForTaskMock = vi.fn();

vi.mock('meilisearch', () => {
  class MeiliSearch {
    tasks = { waitForTask: waitForTaskMock };
    constructor(public readonly config: unknown) {}
    index() {
      return {
        search: searchMock,
        updateSettings: updateSettingsMock,
        deleteAllDocuments: deleteAllMock,
        addDocuments: addDocumentsMock,
      };
    }
  }
  return { MeiliSearch };
});

import { MeiliCollectionSearch } from './meili-collection-search.adapter';

const config = {
  get: (key: string) =>
    (
      ({ MEILI_HOST: 'http://meili:7700', MEILI_API_KEY: 'k', APP_ENV: 'dev' }) as Record<
        string,
        string
      >
    )[key],
} as unknown as ConfigService;

function query(overrides: Partial<CollectionSearchQuery> = {}): CollectionSearchQuery {
  return {
    eras: [],
    instruments: [],
    techniques: [],
    moods: [],
    curators: [],
    sort: 'featured',
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

describe('MeiliCollectionSearch.search', () => {
  let adapter: MeiliCollectionSearch;

  beforeEach(() => {
    searchMock.mockReset();
    adapter = new MeiliCollectionSearch(config);
    searchMock.mockResolvedValue({
      hits: [{ view: { slug: 'c1', title: 'Course 1', kind: 'course' } }],
      facetDistribution: {
        kind: { course: 2 },
        eras: { baroque: 1 },
        instruments: {},
        techniques: {},
        moods: {},
        curator: { 'jane-doe': 1 },
        grades: { '2': 1, '1': 2 },
      },
      totalHits: 1,
    });
  });

  it('maps hits + labels facets via slugToLabel, difficulties by grade asc', async () => {
    const result = await adapter.search(query());
    expect(result.items).toEqual([{ slug: 'c1', title: 'Course 1', kind: 'course' }]);
    expect(result.facets.kinds).toEqual([{ value: 'course', label: 'Course', count: 2 }]);
    expect(result.facets.curators).toEqual([{ value: 'jane-doe', label: 'Jane doe', count: 1 }]);
    expect(result.facets.difficulties).toEqual([
      { value: '1', label: 'Grade 1', count: 2 },
      { value: '2', label: 'Grade 2', count: 1 },
    ]);
  });

  it('always gates visibility to public/authed and maps difficulty to a grade filter', async () => {
    await adapter.search(query({ difficulty: 3, kind: 'course', eras: ['baroque'] }));
    const opts = argsOf(searchMock)[1] as { filter: string[] };
    expect(opts.filter).toContain('visibility IN ["public", "authed"]');
    expect(opts.filter).toContain('grades IN ["3"]');
    expect(opts.filter).toContain('kind = "course"');
    expect(opts.filter).toContain('eras IN ["baroque"]');
  });

  it('maps sorts; featured sorts by featuredRank then popularity', async () => {
    await adapter.search(query({ sort: 'featured' }));
    expect((argsOf(searchMock)[1] as { sort?: string[] }).sort).toEqual([
      'featuredRank:desc',
      'popularity:desc',
    ]);
    searchMock.mockClear();
    await adapter.search(query({ sort: 'newest' }));
    expect((argsOf(searchMock)[1] as { sort?: string[] }).sort).toEqual(['createdAtMs:desc']);
  });
});

describe('MeiliCollectionSearch.indexAll', () => {
  it('indexes only discoverable collections with snapshotted ratings + grade band', async () => {
    updateSettingsMock.mockReset();
    deleteAllMock.mockReset();
    addDocumentsMock.mockReset();
    waitForTaskMock.mockReset();
    addDocumentsMock.mockResolvedValue({ taskUid: 9 });

    const adapter = new MeiliCollectionSearch(config);
    const base = {
      title: 'C',
      summary: null,
      kind: 'course',
      status: 'published',
      curationType: 'editorial',
      featured: true,
      difficultyMin: 1,
      difficultyMax: 3,
      curatorName: 'Jane',
      facets: { era: ['baroque'] },
      tags: ['tag'],
      popularity: 5,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      itemSlugs: ['x', 'y'],
    };
    const publicC = { ...base, id: 'p', slug: 'p', visibility: 'public' } as unknown as Collection;
    const privateC = {
      ...base,
      id: 'q',
      slug: 'q',
      visibility: 'private',
    } as unknown as Collection;
    const ratings = new Map<string, CollectionRatingAggregate>([['p', { average: 4.5, count: 2 }]]);

    await adapter.indexAll([publicC, privateC], ratings);

    const [docs] = argsOf(addDocumentsMock) as [unknown[]];
    expect(docs).toHaveLength(1); // private excluded
    expect(docs[0]).toMatchObject({
      id: 'p',
      featuredRank: 1,
      grades: ['1', '2', '3'],
      eras: ['baroque'],
      view: expect.objectContaining({ slug: 'p', averageRating: 4.5, ratingCount: 2 }),
    });
    expect(waitForTaskMock).toHaveBeenCalledWith(9);
  });
});
