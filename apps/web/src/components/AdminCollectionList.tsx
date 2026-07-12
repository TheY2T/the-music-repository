import type { CollectionSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collectionsAdminApi } from '@/lib/admin-api';

export default function AdminCollectionList({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<CollectionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    collectionsAdminApi
      .list()
      .then((result) => setItems(result.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{t(locale, 'acoll.loadError', { error })}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'acoll.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href={localizedPath(locale, '/admin/collections/new')}>
          <Button size="sm">{t(locale, 'acoll.newCollection')}</Button>
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'acoll.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">{t(locale, 'acoll.colTitle')}</th>
                <th className="p-3 font-medium">{t(locale, 'acoll.colKind')}</th>
                <th className="p-3 font-medium">{t(locale, 'acoll.colItems')}</th>
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
                      href={localizedPath(
                        locale,
                        `/admin/collections/${encodeURIComponent(collection.slug)}/edit`,
                      )}
                      className="text-sm underline"
                    >
                      {t(locale, 'acoll.edit')}
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
