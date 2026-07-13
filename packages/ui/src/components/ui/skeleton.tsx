import type * as React from 'react';
import { cn } from '../../lib/utils';

/** Loading placeholder — a pulsing muted block. Size via className. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
