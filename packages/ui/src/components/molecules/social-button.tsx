import type * as React from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

/** Social identity providers a {@link SocialButton} can represent. */
export type SocialProvider = 'google' | 'facebook' | 'microsoft';

/**
 * Provider brand marks. Brand logos aren't part of the Lucide icon set and must keep each provider's
 * official colours/shape to be recognisable, so they're inline SVGs here (the same notation-style
 * exception to the "icons come from the Icon atom" rule).
 */
const BRAND_ICON: Record<SocialProvider, React.ReactNode> = {
  google: (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.73Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.61l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10.4v10.4H1z" />
      <path fill="#7FBA00" d="M12.6 1H23v10.4H12.6z" />
      <path fill="#00A4EF" d="M1 12.6h10.4V23H1z" />
      <path fill="#FFB900" d="M12.6 12.6H23V23H12.6z" />
    </svg>
  ),
};

export interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: SocialProvider;
  /** Localized label, e.g. "Continue with Google" (passed in — this component never calls `t()`). */
  label: string;
}

/** A full-width button carrying a provider brand mark plus a localized label. */
export function SocialButton({ provider, label, className, ...props }: SocialButtonProps) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: 'outline' }), 'w-full', className)}
      {...props}
    >
      {BRAND_ICON[provider]}
      <span>{label}</span>
    </button>
  );
}
