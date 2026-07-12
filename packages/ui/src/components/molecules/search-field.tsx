import type * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { Input } from '../ui/input';

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Called when the clear button is pressed; the button only renders when provided + value set. */
  onClear?: () => void;
}

/** Search input with a leading magnifier and optional clear button. */
export function SearchField({ className, onClear, value, ...props }: SearchFieldProps) {
  const showClear = onClear && !!value;
  return (
    <div className="relative">
      <Icon
        name="search"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input type="search" value={value} className={cn('px-9', className)} {...props} />
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
