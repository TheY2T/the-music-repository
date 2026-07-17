import { Icon } from '@TheY2T/tmr-ui';
import { addFavorite, removeFavorite } from '@TheY2T/tmr-web-data/favorites-api';

/**
 * Presentational heart toggle. Optimistically flips via `onChange` (parent owns the source of truth),
 * then persists. Used inside the catalogue grid and the detail page.
 */
export default function FavoriteHeart({
  slug,
  favorited,
  onChange,
  className,
}: {
  slug: string;
  favorited: boolean;
  onChange: (slug: string, next: boolean) => void;
  className?: string;
}) {
  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const next = !favorited;
    onChange(slug, next); // optimistic
    try {
      await (next ? addFavorite(slug) : removeFavorite(slug));
    } catch {
      onChange(slug, !next); // revert on failure
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`leading-none transition-colors ${favorited ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'} ${className ?? ''}`}
    >
      <Icon name="heart" className={`size-5 ${favorited ? 'fill-current' : ''}`} />
    </button>
  );
}
