import type { CollectionSummary } from '@TheY2T/tmr-api-client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collectionsAdminApi } from '@/lib/admin-api';

export default function AdminCollectionList() {
  const [items, setItems] = useState<CollectionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    collectionsAdminApi
      .list()
      .then((result) => setItems(result.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">Failed to load collections: {error}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href="/admin/collections/new">
          <Button size="sm">+ New collection</Button>
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Kind</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((collection) => (
                <tr key={collection.slug} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{collection.title}</div>
                    <div className="text-xs text-muted-foreground">{collection.slug}</div>
                  </td>
                  <td className="p-3">{collection.kind}</td>
                  <td className="p-3">{collection.itemCount}</td>
                  <td className="p-3 text-right">
                    <a
                      href={`/admin/collections/${encodeURIComponent(collection.slug)}/edit`}
                      className="text-sm underline"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
