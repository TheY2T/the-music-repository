import type * as React from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from '../ui/button';

/** Social identity providers a {@link SocialButton} can represent. */
export type SocialProvider = 'google' | 'facebook' | 'microsoft' | 'whatsapp' | 'apple';

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
  whatsapp: (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="#25D366"
        d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91a9.84 9.84 0 0 0-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.22 8.22 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.39c0-4.54 3.7-8.23 8.24-8.23a8.2 8.2 0 0 1 5.82 2.42 8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z"
      />
    </svg>
  ),
  // Apple's mark is monochrome; `currentColor` tracks the button's foreground token so it stays black on
  // light themes and white on dark ones, per Apple's brand guidance.
  apple: (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.05 12.54c-.03-2.69 2.2-3.98 2.3-4.05-1.25-1.83-3.2-2.08-3.89-2.11-1.66-.17-3.24.98-4.08.98-.84 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.26-.48 8.09 1.35 10.74.89 1.3 1.95 2.75 3.34 2.7 1.34-.05 1.85-.87 3.47-.87 1.62 0 2.08.87 3.5.84 1.44-.03 2.36-1.32 3.24-2.62 1.02-1.5 1.44-2.95 1.46-3.03-.03-.01-2.8-1.08-2.83-4.28M14.38 4.73c.74-.9 1.24-2.14 1.1-3.38-1.06.04-2.35.71-3.11 1.6-.68.79-1.28 2.06-1.12 3.27 1.19.09 2.39-.6 3.13-1.49"
      />
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
