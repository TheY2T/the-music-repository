import type * as React from 'react';
import { cn } from '../../lib/utils';
import { Label } from '../ui/label';

export interface FieldProps {
  /** Visible label text (already localized by the caller — this component is string-agnostic). */
  label?: React.ReactNode;
  /** `htmlFor` / control id association. */
  htmlFor?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + description/error wrapper — the shared form-row primitive replacing the
 * repeated label/input blocks in SignInForm/CollectionForm/ContentForm/HelpTopicForm/etc.
 * Presentational only: pass already-translated strings (no `t()` inside the library).
 */
export function Field({
  label,
  htmlFor,
  description,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
