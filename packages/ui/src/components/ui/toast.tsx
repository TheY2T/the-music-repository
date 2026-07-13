import { useSyncExternalStore } from 'react';
import { cn } from '../../lib/utils';

type ToastVariant = 'default' | 'success' | 'error';
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
let nextId = 0;

function emit() {
  for (const listener of listeners) listener();
}

function push(message: string, variant: ToastVariant) {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((item) => item.id !== id);
    emit();
  }, 4000);
}

/** Fire a toast. Import-and-call from anywhere — no provider needed, just render one `<Toaster/>`. */
export const toast = Object.assign((message: string) => push(message, 'default'), {
  success: (message: string) => push(message, 'success'),
  error: (message: string) => push(message, 'error'),
});

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  default: 'text-info',
  success: 'text-success',
  error: 'text-destructive',
};

/** Renders the fixed bottom-right toast stack. Mount once per island root. */
export function Toaster() {
  const items = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
    () => toasts,
  );
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <output
          key={item.id}
          className={cn(
            'rounded-md border border-border bg-popover px-4 py-3 text-popover-foreground text-sm shadow-lg',
            VARIANT_ACCENT[item.variant],
          )}
        >
          {item.message}
        </output>
      ))}
    </div>
  );
}
