import type { ContentAdminSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import { Badge, Button, Card } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/admin-api';

/** Localized label for a content status (`draft`/`review`/`published`; unknown → draft). */
function statusLabel(locale: Locale, status: string): string {
  const key: MessageKey =
    status === 'published'
      ? 'acl.statusPublished'
      : status === 'review'
        ? 'acl.statusReview'
        : 'acl.statusDraft';
  return t(locale, key);
}

export default function AdminContentList({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<ContentAdminSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .list()
      .then((result) => setItems(result.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{t(locale, 'acl.loadError', { error })}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'acl.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href={localizedPath(locale, '/admin/content/new')}>
          <Button size="sm">+ {t(locale, 'acl.newContent')}</Button>
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'acl.empty')}</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">{t(locale, 'acl.colTitle')}</th>
                <th className="p-3 font-medium">{t(locale, 'acl.colType')}</th>
                <th className="p-3 font-medium">{t(locale, 'acl.colStatus')}</th>
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
                    <Badge variant={item.status === 'published' ? 'success' : 'secondary'}>
                      {statusLabel(locale, item.status)}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <a
                      href={localizedPath(
                        locale,
                        `/admin/content/${encodeURIComponent(item.slug)}/edit`,
                      )}
                      className="text-sm underline"
                    >
                      {t(locale, 'acl.edit')}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
