import type { HelpTopic } from '@TheY2T/tmr-api-client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { listHelpTopics } from '@/lib/help-api';

export default function AdminHelpList() {
  const [items, setItems] = useState<HelpTopic[] | null>(null);

  useEffect(() => {
    listHelpTopics().then(setItems);
  }, []);

  if (!items) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href="/admin/help/new">
          <Button size="sm">+ New help topic</Button>
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No help topics yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">Term</th>
                <th className="p-3 font-medium">Slug</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((topic) => (
                <tr key={topic.slug} className="border-b last:border-0">
                  <td className="p-3 font-medium">{topic.term}</td>
                  <td className="p-3 text-muted-foreground">{topic.slug}</td>
                  <td className="p-3 text-right">
                    <a
                      href={`/admin/help/${encodeURIComponent(topic.slug)}/edit`}
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
