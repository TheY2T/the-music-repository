import type * as React from 'react';
import { useId, useState } from 'react';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Minimal hover/focus tooltip. Hand-rolled (no floating-ui): absolutely-positioned bubble. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: passive hover/focus wrapper that reveals a describedby bubble; the child remains the focusable control.
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-popover-foreground text-xs shadow',
            className,
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
