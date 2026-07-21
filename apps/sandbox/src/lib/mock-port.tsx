import type { ApiDataPort } from '@TheY2T/tmr-web-acl/api-data';

/**
 * A dependency-free stand-in for the real data-access port. The sandbox renders components in isolation,
 * so instead of talking to the API it satisfies every `useApiData()` hook with canned, already-resolved
 * results. Data-backed components (catalogue, collections, content, health, coursework) therefore mount
 * and render their empty/idle states rather than throwing "must be used within an <ApiDataProvider>".
 *
 * The datasets are intentionally empty — the sandbox showcases component chrome, layout, theming, and
 * interaction, not seeded catalogue content. Seeding richer fixtures here is a future enhancement.
 *
 * The generated api-client hooks have heavily-overloaded signatures; matching them structurally is not
 * the point, so the assembled object is cast to the port interface.
 */

/** An already-resolved react-query result the UI can read synchronously. */
function ready(data: unknown) {
  return {
    data,
    error: null,
    isError: false,
    isPending: false,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isRefetching: false,
    status: 'success',
    fetchStatus: 'idle',
    refetch: () => Promise.resolve(ready(data)),
    queryKey: [] as unknown[],
  };
}

/** Orval wraps every response body as `{ status, data, headers }`. */
function response(body: unknown) {
  return ready({ status: 200, data: body, headers: new Headers() });
}

const CATALOGUE_FACETS = {
  genres: [],
  eras: [],
  instruments: [],
  topics: [],
  composers: [],
  keys: [],
  types: [],
  difficulties: [],
};

const COLLECTION_FACETS = {
  kinds: [],
  difficulties: [],
  eras: [],
  instruments: [],
  techniques: [],
};

const emptyCatalogue = { items: [], total: 0, page: 1, pageSize: 12, facets: CATALOGUE_FACETS };
const emptyCollections = { items: [], total: 0, page: 1, pageSize: 12, facets: COLLECTION_FACETS };
const health = { status: 'ok', service: 'sandbox-mock', checks: { database: 'up' } };

export const mockPort = {
  useSearchCatalogue: () => response(emptyCatalogue),
  useSearchCollections: () => response(emptyCollections),
  useGetHealth: () => response(health),
  useGetRelatedContent: () => response({ items: [] }),
  useGetContentBySlug: () => response(undefined),
  useGetCollectionWithProgress: () => response(undefined),
  useListCollectionsForContent: () => response({ items: [] }),
} as unknown as ApiDataPort;
