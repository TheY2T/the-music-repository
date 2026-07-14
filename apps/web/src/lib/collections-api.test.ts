import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserCollection,
  listSavedCollectionSlugs,
  rateCollection,
  saveCollection,
  setUserCollectionItems,
  unsaveCollection,
} from './collections-api';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('collections-api', () => {
  it('listSavedCollectionSlugs projects saved items to slugs', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ slug: 'a' }, { slug: 'b' }] }),
    });
    expect(await listSavedCollectionSlugs()).toEqual(['a', 'b']);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/saved-collections'), {
      credentials: 'include',
    });
  });

  it('saveCollection POSTs the bookmark route with credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await saveCollection('blues roadmap');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/me/collections/blues%20roadmap/bookmark'),
      { method: 'POST', credentials: 'include' },
    );
  });

  it('unsaveCollection DELETEs the bookmark route', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await unsaveCollection('c1');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/me/collections/c1/bookmark'), {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('rateCollection PUTs the rating body and returns the result', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ average: 4, count: 1, yourRating: 4 }),
    });
    const result = await rateCollection('c1', 4);
    expect(result).toEqual({ average: 4, count: 1, yourRating: 4 });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ rating: 4 });
  });

  it('rateCollection returns null on a failed response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    expect(await rateCollection('c1', 4)).toBeNull();
  });

  it('createUserCollection POSTs the write body', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ slug: 'new-x' }) });
    const result = await createUserCollection({ title: 'Mine', visibility: 'private' });
    expect(result).toEqual({ slug: 'new-x' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/me/collections');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ title: 'Mine', visibility: 'private' });
  });

  it('setUserCollectionItems wraps items in the { items } envelope', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ slug: 'c1' }) });
    await setUserCollectionItems('c1', [{ contentSlug: 'a' }, { contentSlug: 'b' }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/me/collections/c1/items');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ items: [{ contentSlug: 'a' }, { contentSlug: 'b' }] });
  });
});
