import { QueryClient } from '@tanstack/react-query';

/** Builds a query client tuned for the generated hooks. Callers own the provider that mounts it. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
  });
}
