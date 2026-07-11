import type { ContentAdminSummary } from '@TheY2T/tmr-api-client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/admin-api';

export default function AdminContentList() {
  const [items, setItems] = useState<ContentAdminSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .list()
      .then((result) => setItems(result.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">Failed to load content: {error}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href="/admin/content/new">
          <Button size="sm">+ New content</Button>
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No content yet. Create the first item.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.slug} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.slug}</div>
                  </td>
                  <td className="p-3">{item.type}</td>
                  <td className="p-3">
                    <span
                      className={
                        item.status === 'published'
                          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'rounded-full bg-muted px-2 py-0.5 text-xs'
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={`/admin/content/${encodeURIComponent(item.slug)}/edit`}
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
