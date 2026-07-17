import { Button, cn, Icon } from '@TheY2T/tmr-ui';
import { saveCollection, unsaveCollection } from '@TheY2T/tmr-web-data/collections-api';
import { useState } from 'react';

/**
 * Optimistic bookmark toggle for a collection (auth-gated by the caller). Self-managing: seeds from
 * `initialSaved`, flips optimistically, reverts on failure. i18n-by-prop.
 */
export default function SaveCollectionButton({
  slug,
  initialSaved = false,
  variant = 'icon',
  labels,
  className,
}: {
  slug: string;
  initialSaved?: boolean;
  variant?: 'icon' | 'button';
  labels: { save: string; saved: string };
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistic
    try {
      await (next ? saveCollection(slug) : unsaveCollection(slug));
    } catch {
      setSaved(!next);
    }
  }

  const label = saved ? labels.saved : labels.save;

  if (variant === 'button') {
    return (
      <Button
        type="button"
        variant={saved ? 'secondary' : 'outline'}
        size="sm"
        onClick={toggle}
        aria-pressed={saved}
        className={className}
      >
        <Icon name={saved ? 'bookmark-check' : 'bookmark'} className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        'leading-none transition-colors',
        saved ? 'text-accent' : 'text-muted-foreground hover:text-accent',
        className,
      )}
    >
      <Icon name={saved ? 'bookmark-check' : 'bookmark'} className="size-5" />
    </button>
  );
}
