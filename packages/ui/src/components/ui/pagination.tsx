import type * as React from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Current page, 1-based. */
  page: number;
  /** Total number of pages. */
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** Build a compact page list with `'ellipsis'` gaps: always show first/last + a window around page. */
function buildPages(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push('ellipsis');
  for (let index = start; index <= end; index++) pages.push(index);
  if (end < pageCount - 1) pages.push('ellipsis');
  pages.push(pageCount);
  return pages;
}

/** Numbered pager with Prev/Next. Uses `buttonVariants` so it matches the button system. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  const pages = buildPages(page, pageCount);
  return (
    <nav
      aria-label="pagination"
      className={cn('flex items-center justify-center gap-1', className)}
      {...props}
    >
      <button
        type="button"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      {pages.map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: item === page ? 'default' : 'outline', size: 'sm' }),
            )}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
