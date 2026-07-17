import FavoriteHeart from '@TheY2T/tmr-musickit-ui/FavoriteHeart';
import { listFavoriteSlugs } from '@TheY2T/tmr-web-data/favorites-api';
import { useEffect, useState } from 'react';

/** Standalone heart + label for the content detail page. Fetches its own initial state. */
export default function FavoriteButton({ slug }: { slug: string }) {
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    listFavoriteSlugs().then((slugs) => setFavorited(slugs.includes(slug)));
  }, [slug]);

  return (
    <div className="flex items-center gap-2">
      <FavoriteHeart
        slug={slug}
        favorited={favorited}
        onChange={(_, next) => setFavorited(next)}
        className="text-2xl"
      />
      <span className="text-sm text-muted-foreground">
        {favorited ? 'Favorited' : 'Add to favorites'}
      </span>
    </div>
  );
}
