import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface SheetContextValue {
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue>({ onOpenChange: () => {} });

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Edge drawer. Same controlled open/portal/Escape model as `Dialog`; slides in from the chosen
 * edge. Backs the mobile nav. Hand-rolled (no vaul) and island-friendly.
 */
export function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <SheetContext.Provider value={{ onOpenChange }}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: overlay is a dismiss affordance; the panel stops propagation. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape-to-close handled globally in the effect above. */}
      <div className="fixed inset-0 z-50 bg-foreground/50" onClick={() => onOpenChange(false)}>
        {children}
      </div>
    </SheetContext.Provider>,
    document.body,
  );
}

const sheetVariants = cva(
  'fixed z-50 flex flex-col gap-4 border-border bg-popover p-6 text-popover-foreground shadow-lg',
  {
    variants: {
      side: {
        left: 'inset-y-0 left-0 h-full w-80 max-w-[85vw] border-r',
        right: 'inset-y-0 right-0 h-full w-80 max-w-[85vw] border-l',
        top: 'inset-x-0 top-0 w-full border-b',
        bottom: 'inset-x-0 bottom-0 w-full border-t',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

export interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {}

export function SheetContent({ className, children, side, ...props }: SheetContentProps) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal handled by the Sheet Escape listener.
    <div
      role="dialog"
      aria-modal="true"
      className={cn(sheetVariants({ side }), className)}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-semibold text-lg tracking-tight', className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

export function SheetClose({
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useContext(SheetContext);
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        onOpenChange(false);
      }}
      {...props}
    />
  );
}
