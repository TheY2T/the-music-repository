import type { ContentSummary } from '@TheY2T/tmr-api-client';
import { useEffect, useState } from 'react';
import { listFavorites } from '@/lib/favorites-api';

export default function MyFavorites() {
  const [items, setItems] = useState<ContentSummary[] | null>(null);

  useEffect(() => {
    listFavorites().then(setItems);
  }, []);

  if (!items) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No favorites yet. Browse the{' '}
        <a href="/catalogue" className="underline">
          catalogue
        </a>{' '}
        and tap ♡.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug}>
          <a
            href={`/catalogue/${item.slug}`}
            className="flex h-full flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{item.type}</span>
              {item.difficulty ? (
                <span className="text-xs text-muted-foreground">Grade {item.difficulty}</span>
              ) : null}
            </div>
            <h2 className="font-semibold leading-snug">{item.title}</h2>
            {item.summary ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{item.summary}</p>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  );
}
