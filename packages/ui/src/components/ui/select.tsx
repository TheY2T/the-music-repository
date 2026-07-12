import type * as React from 'react';
import { cn } from '../../lib/utils';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Styled native `<select>`. Kept as a native element (not a Radix listbox) because the app uses
 * native selects throughout and this stays island-friendly (no cross-island React context). A
 * Radix-backed `Select` can be added later via the shadcn CLI into this package if richer menus
 * are needed.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
