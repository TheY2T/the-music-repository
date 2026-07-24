import type { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { ContentRepository } from '../application/ports/content-repository.port';
import type { CatalogueQuery, ContentItem } from '../domain/content-item';

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

import { MeiliCatalogueSearch } from './meili-catalogue-search.adapter';

const config = {
  get: (key: string) =>
    (
      ({ MEILI_HOST: 'http://meili:7700', MEILI_API_KEY: 'k', APP_ENV: 'dev' }) as Record<
        string,
        string
      >
    )[key],
} as unknown as ConfigService;

const repository = {} as ContentRepository;

function query(overrides: Partial<CatalogueQuery> = {}): CatalogueQuery {
  return {
    genres: [],
    instruments: [],
    topics: [],
    eras: [],
    composers: [],
    keys: [],
    page: 1,
    pageSize: 10,
    sort: 'relevance',
    ...overrides,
  };
}

describe('MeiliCatalogueSearch.search', () => {
  let adapter: MeiliCatalogueSearch;

  beforeEach(() => {
    searchMock.mockReset();
    adapter = new MeiliCatalogueSearch(config, repository);
    searchMock.mockResolvedValue({
      hits: [
        {
          view: {
            slug: 'a',
            title: 'A',
            type: 'lesson',
            visibility: 'public',
            genres: [],
            instruments: [],
            topics: [],
          },
        },
      ],
      facetDistribution: {
        genreSlugs: { jazz: 2, rock: 1 },
        instrumentSlugs: {},
        topicSlugs: {},
        type: { lesson: 3 },
        era: { Baroque: 1 },
        composer: {},
        key: {},
        difficulty: { '3': 1, '1': 2 },
      },
      totalHits: 1,
    });
  });

  it('returns the stored views and total', async () => {
    const result = await adapter.search(query({ q: 'foo' }));
    expect(result.items).toEqual([
      {
        slug: 'a',
        title: 'A',
        type: 'lesson',
        visibility: 'public',
        genres: [],
        instruments: [],
        topics: [],
      },
    ]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('labels + orders facets like the Postgres adapter', async () => {
    const { facets } = await adapter.search(query());
    // Taxonomy slugs labelled + ordered by count desc.
    expect(facets.genres).toEqual([
      { value: 'jazz', label: 'Jazz', count: 2 },
      { value: 'rock', label: 'Rock', count: 1 },
    ]);
    // Types labelled from the slug.
    expect(facets.types).toEqual([{ value: 'lesson', label: 'Lesson', count: 3 }]);
    // Era value == label.
    expect(facets.eras).toEqual([{ value: 'Baroque', label: 'Baroque', count: 1 }]);
    // Difficulties ordered by grade asc, labelled `Grade N`.
    expect(facets.difficulties).toEqual([
      { value: '1', label: 'Grade 1', count: 2 },
      { value: '3', label: 'Grade 3', count: 1 },
    ]);
  });

  it('builds an OR-within / AND-across filter with the visibility gate', async () => {
    await adapter.search(query({ genres: ['jazz', 'rock'], type: 'lesson', difficultyMin: 2 }));
    const opts = argsOf(searchMock)[1] as { filter: string[] };
    expect(opts.filter).toContain('visibility IN ["public", "authed", "premium"]');
    expect(opts.filter).toContain('genreSlugs IN ["jazz", "rock"]');
    expect(opts.filter).toContain('type = "lesson"');
    expect(opts.filter).toContain('difficulty >= 2');
  });

  it('maps sort options; relevance sends no explicit sort', async () => {
    await adapter.search(query({ sort: 'title-asc' }));
    expect((argsOf(searchMock)[1] as { sort?: string[] }).sort).toEqual(['title:asc']);

    searchMock.mockClear();
    await adapter.search(query({ sort: 'difficulty-desc' }));
    expect((argsOf(searchMock)[1] as { sort?: string[] }).sort).toEqual(['difficulty:desc']);

    searchMock.mockClear();
    await adapter.search(query({ sort: 'relevance' }));
    expect((argsOf(searchMock)[1] as { sort?: string[] }).sort).toBeUndefined();
  });
});

describe('MeiliCatalogueSearch.indexAll', () => {
  it('configures settings and replaces the documents', async () => {
    updateSettingsMock.mockReset();
    deleteAllMock.mockReset();
    addDocumentsMock.mockReset();
    waitForTaskMock.mockReset();
    addDocumentsMock.mockResolvedValue({ taskUid: 7 });

    const adapter = new MeiliCatalogueSearch(config, repository);
    const item = {
      id: 'id-1',
      slug: 'sonata',
      title: 'Sonata',
      summary: 'A sonata',
      type: 'score',
      visibility: 'public',
      tier: null,
      difficulty: 5,
      details: { era: 'Classical', composer: 'Mozart', key: 'C major' },
      genres: [{ slug: 'classical', name: 'Classical' }],
      instruments: [{ slug: 'piano', name: 'Piano' }],
      topics: [],
    } as unknown as ContentItem;

    await adapter.indexAll([item]);

    expect(updateSettingsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        searchableAttributes: expect.arrayContaining(['title', 'summary']),
        filterableAttributes: expect.arrayContaining(['visibility', 'genreSlugs', 'difficulty']),
        sortableAttributes: expect.arrayContaining(['difficulty', 'title']),
      }),
    );
    expect(deleteAllMock).toHaveBeenCalled();
    const [docs, opts] = argsOf(addDocumentsMock) as [unknown[], unknown];
    expect(opts).toEqual({ primaryKey: 'id' });
    expect(docs[0]).toMatchObject({
      id: 'id-1',
      genreSlugs: ['classical'],
      difficulty: 5,
      era: 'Classical',
      composer: 'Mozart',
      key: 'C major',
      view: expect.objectContaining({ slug: 'sonata', title: 'Sonata' }),
    });
    expect(waitForTaskMock).toHaveBeenCalledWith(7);
  });
});
