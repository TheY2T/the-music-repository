import { Label } from './label';
import { Pagination } from './pagination';
import { Select } from './select';

export interface PaginationBarProps {
  /** Current page (1-based). */
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizes: readonly number[];
  rangeFrom: number;
  rangeTo: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Localized "Per page" label (i18n-by-prop). */
  perPageLabel: string;
  /** Localized, pre-formatted "Showing X–Y of N" string. */
  showingLabel: string;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
}

/**
 * The standard table / list footer (ADR 0018): a rows-per-page selector + a "Showing X–Y of N" range on
 * the left and the numbered `Pagination` pager on the right. Pairs with the `usePagination` hook. Strictly
 * presentational — every label is passed in already localized. The pager only shows when there is more than
 * one page. Use this on every data table and long list so paging looks and behaves the same everywhere.
 */
export function PaginationBar({
  page,
  pageCount,
  pageSize,
  pageSizes,
  rangeFrom: _rangeFrom,
  rangeTo: _rangeTo,
  total: _total,
  onPageChange,
  onPageSizeChange,
  perPageLabel,
  showingLabel,
  prevLabel,
  nextLabel,
  className,
}: PaginationBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3${className ? ` ${className}` : ''}`}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Label className="flex items-center gap-2">
          {perPageLabel}
          <Select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={perPageLabel}
            className="w-auto"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </Label>
        <span>{showingLabel}</span>
      </div>
      {pageCount > 1 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      ) : null}
    </div>
  );
}
