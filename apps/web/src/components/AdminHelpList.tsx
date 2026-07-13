import type { HelpTopic } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  buttonVariants,
  Card,
  cn,
  EmptyState,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@TheY2T/tmr-ui';
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
        <a
          href={localizedPath(locale, '/admin/help/new')}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <Icon name="plus" className="size-4" />
          {t(locale, 'ahelp.newTopic')}
        </a>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Icon name="info" className="size-6" />}
          title={t(locale, 'ahelp.empty')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>{t(locale, 'ahelp.colTerm')}</TableHead>
                <TableHead>{t(locale, 'ahelp.colSlug')}</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((topic) => (
                <TableRow key={topic.slug}>
                  <TableCell className="font-medium text-foreground">{topic.term}</TableCell>
                  <TableCell className="text-muted-foreground">{topic.slug}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={localizedPath(
                        locale,
                        `/admin/help/${encodeURIComponent(topic.slug)}/edit`,
                      )}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      <Icon name="pencil" className="size-4" />
                      {t(locale, 'ahelp.edit')}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
