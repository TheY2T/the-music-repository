import { useEffect, useMemo, useState } from 'react';

/** The standard rows-per-page options for every data table / long list in the app. */
export const DEFAULT_PAGE_SIZES = [10, 25, 50, 100, 200] as const;

export interface UsePaginationResult<T> {
  /** Current page (1-based), clamped to the valid range. */
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  pageCount: number;
  /** The items on the current page (already sliced). */
  pageItems: T[];
  total: number;
  /** 1-based index of the first item shown (0 when empty). */
  rangeFrom: number;
  /** 1-based index of the last item shown. */
  rangeTo: number;
  pageSizes: readonly number[];
}

/**
 * Client-side pagination for any array (ADR 0018) — the shared standard behind every data table / long
 * list. Returns the current page slice + the state a `PaginationBar` needs. Pass `resetKey` (e.g. the
 * active search/filter value) so changing it snaps back to page 1; the page is always clamped to the
 * valid range as the list shrinks.
 */
export function usePagination<T>(
  items: T[],
  options?: { pageSizes?: readonly number[]; initialPageSize?: number; resetKey?: unknown },
): UsePaginationResult<T> {
  const pageSizes = options?.pageSizes ?? DEFAULT_PAGE_SIZES;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(options?.initialPageSize ?? pageSizes[0] ?? 10);

  const resetKey = options?.resetKey;
  // biome-ignore lint/correctness/useExhaustiveDependencies: page resets when size or the caller's filter key changes
  useEffect(() => {
    setPage(1);
  }, [pageSize, resetKey]);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [items, clampedPage, pageSize],
  );

  return {
    page: clampedPage,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    pageItems,
    total,
    rangeFrom: total === 0 ? 0 : (clampedPage - 1) * pageSize + 1,
    rangeTo: Math.min(clampedPage * pageSize, total),
    pageSizes,
  };
}
