import type * as React from 'react';
import { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('Accordion components must be used within <Accordion>');
  return context;
}

const AccordionItemContext = createContext<string>('');

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string[];
}

/** Collapsible sections. `type="single"` keeps one open; `type="multiple"` allows many. */
export function Accordion({
  type = 'single',
  defaultValue = [],
  className,
  children,
  ...props
}: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultValue);
  const isOpen = (value: string) => open.includes(value);
  const toggle = (value: string) => {
    setOpen((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      return type === 'single' ? [value] : [...prev, value];
    });
  };
  return (
    <AccordionContext.Provider value={{ isOpen, toggle }}>
      <div className={cn('flex flex-col', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={cn('border-border border-b', className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isOpen, toggle } = useAccordionContext();
  const value = useContext(AccordionItemContext);
  const open = isOpen(value);
  return (
    <button
      type="button"
      aria-expanded={open}
      className={cn(
        'flex w-full items-center justify-between gap-2 py-4 text-left font-medium text-sm transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      onClick={() => toggle(value)}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-2 w-2 shrink-0 rotate-45 border-current border-r border-b transition-transform',
          open ? '-rotate-135' : 'rotate-45',
        )}
      />
    </button>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useAccordionContext();
  const value = useContext(AccordionItemContext);
  if (!isOpen(value)) return null;
  return (
    <div className={cn('pb-4 text-muted-foreground text-sm', className)} {...props}>
      {children}
    </div>
  );
}
