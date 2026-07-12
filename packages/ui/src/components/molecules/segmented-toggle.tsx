import { cn } from '../../lib/utils';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: React.ReactNode;
  title?: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Segmented pill group — one active option at a time. Replaces the hand-rolled active/inactive
 * button pills (e.g. LanguageSwitcher). Presentational: labels are supplied already-localized.
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onValueChange,
  className,
  'aria-label': ariaLabel,
}: SegmentedToggleProps<T>) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a pill toggle group is not a <fieldset>; the group role + aria-label is the right grouping semantics here.
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            aria-pressed={active}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
