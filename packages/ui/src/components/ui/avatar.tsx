import type * as React from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

/** Round avatar container. Compose with `AvatarImage` + `AvatarFallback`. Size via className. */
export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  );
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function AvatarImage({ className, alt = '', onError, ...props }: AvatarImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      className={cn('size-full object-cover', className)}
      alt={alt}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'flex size-full items-center justify-center font-medium text-muted-foreground text-sm',
        className,
      )}
      {...props}
    />
  );
}
