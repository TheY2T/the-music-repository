import { cn } from '../../lib/utils';
import { Checkbox } from '../ui/checkbox';

export interface FacetOption {
  value: string;
  label: string;
  count?: number;
  selected: boolean;
}

export interface FacetGroup {
  key: string;
  label: string;
  options: FacetOption[];
  /** Optional Info View slug — sets `data-help` on the group heading so hovering it explains the facet. */
  helpSlug?: string;
}

export interface FacetPanelProps {
  groups: FacetGroup[];
  onToggle: (groupKey: string, value: string) => void;
  className?: string;
}

/**
 * Presentational faceted-filter sidebar: grouped checkbox rows with right-aligned counts. Fully
 * controlled — selection state lives in `groups`; `onToggle` reports intent. i18n-by-prop.
 */
export function FacetPanel({ groups, onToggle, className }: FacetPanelProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {groups.map((group) => (
        <section key={group.key}>
          <h3
            data-help={group.helpSlug}
            className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {group.label}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {group.options.map((option) => (
              <li key={option.value}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                    option.selected && 'font-medium text-foreground',
                  )}
                >
                  <Checkbox
                    checked={option.selected}
                    onChange={() => onToggle(group.key, option.value)}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.count !== undefined ? (
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {option.count}
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
