import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addFavorite, listFavoriteSlugs, listFavorites, removeFavorite } from './favorites-api';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('favorites-api', () => {
  it('listFavorites returns items and sends credentials', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ slug: 'a' }, { slug: 'b' }] }),
    });
    const items = await listFavorites();
    expect(items).toEqual([{ slug: 'a' }, { slug: 'b' }]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/favorites'), {
      credentials: 'include',
    });
  });

  it('listFavorites returns [] on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    expect(await listFavorites()).toEqual([]);
  });

  it('listFavoriteSlugs projects to slugs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ slug: 'a' }, { slug: 'b' }] }),
    });
    expect(await listFavoriteSlugs()).toEqual(['a', 'b']);
  });

  it('addFavorite POSTs the URL-encoded slug with credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await addFavorite('jazz blues');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/favorites/jazz%20blues'), {
      method: 'POST',
      credentials: 'include',
    });
  });

  it('removeFavorite DELETEs the slug with credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await removeFavorite('a');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/favorites/a'), {
      method: 'DELETE',
      credentials: 'include',
    });
  });
});
