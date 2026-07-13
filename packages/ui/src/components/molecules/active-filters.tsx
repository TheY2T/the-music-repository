import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface ActiveFilterItem {
  key: string;
  label: string;
  onRemove: () => void;
  /** Already-localized accessible label for the remove button (e.g. "Remove Baroque"). */
  removeLabel?: string;
}

export interface ActiveFiltersProps {
  filters: ActiveFilterItem[];
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
}

/** Row of removable applied-filter chips with an optional "clear all" action. i18n-by-prop. */
export function ActiveFilters({ filters, onClear, clearLabel, className }: ActiveFiltersProps) {
  if (filters.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-0.5 pl-2.5 pr-1 text-xs font-medium text-muted-foreground"
        >
          {filter.label}
          <button
            type="button"
            onClick={filter.onRemove}
            aria-label={filter.removeLabel}
            className="rounded-full p-0.5 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="x" className="size-3" />
          </button>
        </span>
      ))}
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {clearLabel}
        </button>
      ) : null}
    </div>
  );
}
