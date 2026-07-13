import type * as React from 'react';
import { cn } from '../../lib/utils';

/** Breadcrumb navigation landmark. Compose with the list/item/link/page/separator parts. */
export function Breadcrumb({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <nav aria-label="breadcrumb" className={className} {...props} />;
}

export function BreadcrumbList({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      className={cn('flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

export function BreadcrumbLink({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cn('transition-colors hover:text-foreground', className)} {...props} />;
}

export function BreadcrumbPage({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span aria-current="page" className={cn('font-normal text-foreground', className)} {...props} />
  );
}

export function BreadcrumbSeparator({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li aria-hidden="true" className={cn('text-muted-foreground', className)} {...props}>
      {children ?? '/'}
    </li>
  );
}
