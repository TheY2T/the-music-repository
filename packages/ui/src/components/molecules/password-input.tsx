import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { Input, type InputProps } from '../ui/input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  /** Accessible label for the reveal button while the password is hidden (localized by the consumer). */
  showLabel?: string;
  /** Accessible label for the button while the password is visible (localized by the consumer). */
  hideLabel?: string;
}

/**
 * Password field with a show/hide toggle. Clicking the eye reveals the typed characters (switches the
 * input between `password` and `text`) so someone can check what they've entered. Labels are passed in —
 * this stays presentational and never calls `t()`.
 */
export function PasswordInput({
  className,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center rounded-md px-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name={visible ? 'eye-off' : 'eye'} className="size-4" />
      </button>
    </div>
  );
}
