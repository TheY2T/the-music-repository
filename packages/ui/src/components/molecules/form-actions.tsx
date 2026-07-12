import type * as React from 'react';
import { cn } from '../../lib/utils';

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'between';
}

/** Row of action buttons at the foot of a form/dialog. */
export function FormActions({ className, align = 'end', ...props }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        align === 'end' && 'justify-end',
        align === 'between' && 'justify-between',
        className,
      )}
      {...props}
    />
  );
}
