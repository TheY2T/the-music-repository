import {
  createQueryClient,
  useGetCollectionWithProgress,
  useGetContentBySlug,
  useGetHealth,
  useGetRelatedContent,
  useListCollectionsForContent,
  useSearchCatalogue,
  useSearchCollections,
} from '@TheY2T/tmr-api-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useContext, useState } from 'react';

/**
 * Abstract data-access port the UI consumes. Field types are inferred from the concrete hooks, so
 * callers keep exact param/return typing without ever naming api-client in their own source. The web
 * app binds a concrete implementation via {@link ApiDataProvider} and the UI reads it with
 * {@link useApiData}.
 */
export interface ApiDataPort {
  useSearchCatalogue: typeof useSearchCatalogue;
  useSearchCollections: typeof useSearchCollections;
  useGetHealth: typeof useGetHealth;
  useGetRelatedContent: typeof useGetRelatedContent;
  useGetContentBySlug: typeof useGetContentBySlug;
  useGetCollectionWithProgress: typeof useGetCollectionWithProgress;
  useListCollectionsForContent: typeof useListCollectionsForContent;
}

const ApiDataContext = createContext<ApiDataPort | null>(null);

/** The concrete api-client-backed port — the only binding of the port to the generated client. */
const apiClientPort: ApiDataPort = {
  useSearchCatalogue,
  useSearchCollections,
  useGetHealth,
  useGetRelatedContent,
  useGetContentBySlug,
  useGetCollectionWithProgress,
  useListCollectionsForContent,
};

/**
 * Provides a query client + the data-access port to everything in one React root. Each root gets its
 * own query client (so a region's cache is isolated). `port` is overridable for tests and Storybook.
 */
export function ApiDataProvider({
  port = apiClientPort,
  children,
}: PropsWithChildren<{ port?: ApiDataPort }>) {
  const [client] = useState(createQueryClient);
  return (
    <QueryClientProvider client={client}>
      <ApiDataContext.Provider value={port}>{children}</ApiDataContext.Provider>
    </QueryClientProvider>
  );
}

/** Reads the data-access port. Throws if used outside an {@link ApiDataProvider}. */
export function useApiData(): ApiDataPort {
  const port = useContext(ApiDataContext);
  if (!port) throw new Error('useApiData must be used within an <ApiDataProvider>');
  return port;
}
