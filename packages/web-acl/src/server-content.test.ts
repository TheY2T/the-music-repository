import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCollectionMeta,
  fetchContentMeta,
  listCollectionSlugs,
  listContentSlugs,
} from './server-content';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('server-content', () => {
  it('fetchContentMeta maps the detail DTO and forwards locale + cookie', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'fur-elise',
        title: 'Für Elise',
        summary: 'A bagatelle in A minor.',
        type: 'piece',
        details: { composer: 'Beethoven', key: 'A minor' },
        updatedAt: '2026-07-19T00:00:00.000Z',
        media: [
          { kind: 'score_pdf', url: 'https://x/score.pdf' },
          { kind: 'image', url: 'https://x/cover.jpg' },
        ],
      }),
    });

    const meta = await fetchContentMeta('fur-elise', {
      apiBaseUrl: 'http://api:3000',
      locale: 'zh-Hans',
      cookie: 'better-auth=1',
    });

    expect(meta).toEqual({
      slug: 'fur-elise',
      title: 'Für Elise',
      summary: 'A bagatelle in A minor.',
      imageUrl: 'https://x/cover.jpg',
      type: 'piece',
      details: { composer: 'Beethoven', key: 'A minor' },
      updatedAt: '2026-07-19T00:00:00.000Z',
      locked: undefined,
      videos: [],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api:3000/catalogue/items/fur-elise?locale=zh-Hans');
    expect(init).toEqual({ headers: { cookie: 'better-auth=1' } });
  });

  it('fetchContentMeta distills youtube embeds into video metadata for structured data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: 'fur-elise',
        title: 'Für Elise',
        type: 'piece',
        media: [],
        embeds: [
          { tool: 'keyboard', root: 'C' },
          {
            tool: 'youtube',
            videoId: 'dQw4w9WgXcQ',
            title: 'A performance',
            thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          },
          { tool: 'youtube', videoUrl: 'https://youtu.be/x' }, // no cached id → skipped
        ],
      }),
    });

    const meta = await fetchContentMeta('fur-elise', { apiBaseUrl: 'http://api:3000' });
    expect(meta?.videos).toEqual([
      {
        videoId: 'dQw4w9WgXcQ',
        title: 'A performance',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        uploadDate: undefined,
      },
    ]);
  });

  it('fetchContentMeta returns null on a 404 / non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    expect(await fetchContentMeta('missing', { apiBaseUrl: 'http://api:3000' })).toBeNull();
  });

  it('fetchContentMeta returns null when the API is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await fetchContentMeta('x', { apiBaseUrl: 'http://api:3000' })).toBeNull();
  });

  it('fetchCollectionMeta maps title + summary', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ slug: 'piano-basics', title: 'Piano Basics', summary: 'Start here.' }),
    });
    expect(await fetchCollectionMeta('piano-basics', { apiBaseUrl: 'http://api:3000' })).toEqual({
      slug: 'piano-basics',
      title: 'Piano Basics',
      summary: 'Start here.',
    });
  });

  it('listContentSlugs pages until it has every slug', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{ slug: 'a' }, { slug: 'b' }],
          total: 3,
          page: 1,
          pageSize: 2,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ slug: 'c' }], total: 3, page: 2, pageSize: 2 }),
      });
    expect(await listContentSlugs({ apiBaseUrl: 'http://api:3000' })).toEqual(['a', 'b', 'c']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('listCollectionSlugs projects the list to slugs, [] on failure', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ slug: 'p' }, { slug: 'q' }] }),
    });
    expect(await listCollectionSlugs({ apiBaseUrl: 'http://api:3000' })).toEqual(['p', 'q']);

    fetchMock.mockResolvedValueOnce({ ok: false });
    expect(await listCollectionSlugs({ apiBaseUrl: 'http://api:3000' })).toEqual([]);
  });
});
