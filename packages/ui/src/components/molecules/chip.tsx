import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../../lib/utils';

const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        outline: 'border-border text-muted-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
      },
      active: {
        true: 'border-primary bg-primary text-primary-foreground',
        false: '',
      },
      interactive: {
        true: 'cursor-pointer hover:border-primary/60',
        false: '',
      },
    },
    defaultVariants: { variant: 'outline', active: false, interactive: false },
  },
);

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof chipVariants> {}

/**
 * Rounded pill — genre pills, filter tags, and the segmented-toggle option style.
 * Presentational; pass an `onClick` + `interactive` when clickable.
 */
export function Chip({ className, variant, active, interactive, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, active, interactive, className }))} {...props} />
  );
}

export { chipVariants };
