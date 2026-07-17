import type * as React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  rootRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenu components must be used within <DropdownMenu>');
  return context;
}

export interface DropdownMenuProps {
  children?: React.ReactNode;
  className?: string;
  /** Inline styles for the root — e.g. `position: fixed` at a cursor point for a context menu. */
  style?: React.CSSProperties;
  /** Controlled open state. Omit for the default uncontrolled (trigger-toggled) behaviour. */
  open?: boolean;
  /** Fires whenever the menu wants to open/close (trigger click, outside-click, Escape, item select). */
  onOpenChange?: (open: boolean) => void;
}

/** Lightweight dropdown menu — manages open state, click-outside and Escape. No floating-ui. Pass
 * `open`/`onOpenChange` to control it (e.g. a right-click context menu anchored via `style`). */
export function DropdownMenu({
  children,
  className,
  style,
  open,
  onOpenChange,
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // The content is portaled outside the root, so an outside-click test must exempt both.
      if (rootRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // setOpen is stable enough; re-subscribing only on open changes is intended.
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open: isOpen, setOpen, rootRef, contentRef }}>
      <div ref={rootRef} className={cn('relative inline-block text-left', className)} style={style}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useDropdownMenuContext();
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event);
        setOpen(!open);
      }}
      {...props}
    />
  );
}

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

export function DropdownMenuContent({
  className,
  align = 'end',
  children,
  style,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, rootRef, contentRef } = useDropdownMenuContext();
  // Portaled to <body> and fixed-positioned from the trigger's rect, so no `overflow` ancestor (e.g.
  // a horizontally-scrolling shelf) can clip it. Positioned once on open + on resize.
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const top = rect.bottom + 8; // matches the previous mt-2 gap
      setPos(
        align === 'end' ? { top, right: window.innerWidth - rect.right } : { top, left: rect.left },
      );
    };
    measure();
    // Close on scroll rather than re-anchoring — the trigger can scroll out of view (e.g. a shelf),
    // and a detached menu chasing it looks broken. Ignore scrolls inside the menu's own content.
    const onScroll = (event: Event) => {
      if (contentRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, align, rootRef, contentRef, setOpen]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div
      ref={contentRef}
      role="menu"
      className={cn(
        'fixed z-50 min-w-[8rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg',
        className,
      )}
      // Hidden for the first frame until measured, so it never flashes at (0,0).
      style={{
        top: pos?.top,
        left: pos?.left,
        right: pos?.right,
        visibility: pos ? 'visible' : 'hidden',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
}

export interface DropdownMenuItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  onSelect?: () => void;
}

export function DropdownMenuItem({
  className,
  onSelect,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext();
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        onSelect?.();
        setOpen(false);
      }}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2 py-1.5 font-semibold text-sm', className)} {...props} />;
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
