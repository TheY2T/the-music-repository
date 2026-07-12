import type { HelpTopic } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import { Button, Card } from '@TheY2T/tmr-ui';
import { useEffect, useState } from 'react';
import { listHelpTopics } from '@/lib/help-api';

export default function AdminHelpList({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<HelpTopic[] | null>(null);

  useEffect(() => {
    listHelpTopics().then(setItems);
  }, []);

  if (!items) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'ahelp.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href={localizedPath(locale, '/admin/help/new')}>
          <Button size="sm">{t(locale, 'ahelp.newTopic')}</Button>
        </a>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(locale, 'ahelp.empty')}</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-3 font-medium">{t(locale, 'ahelp.colTerm')}</th>
                <th className="p-3 font-medium">{t(locale, 'ahelp.colSlug')}</th>
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
                      href={localizedPath(
                        locale,
                        `/admin/help/${encodeURIComponent(topic.slug)}/edit`,
                      )}
                      className="text-sm underline"
                    >
                      {t(locale, 'ahelp.edit')}
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
