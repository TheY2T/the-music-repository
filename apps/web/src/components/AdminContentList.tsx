import type { ContentAdminSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, type MessageKey, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  type BadgeProps,
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
import { adminApi } from '@/lib/admin-api';
import { useBrowseHistory } from '@/lib/browse-history';

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

/** Badge tone for a content status. */
function statusVariant(status: string): BadgeProps['variant'] {
  return status === 'published' ? 'success' : status === 'review' ? 'warning' : 'secondary';
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

  // Scroll to + highlight the row the editor just came back from (no filters here, so no state).
  const { highlightSlug, domId, recordSelect } = useBrowseHistory({
    namespace: 'admin-content',
    itemSlugs: items?.map((i) => i.slug) ?? [],
    ready: items != null,
  });

  if (error) {
    return <p className="text-sm text-destructive">{t(locale, 'acl.loadError', { error })}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'acl.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a
          href={localizedPath(locale, '/admin/content/new')}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <Icon name="plus" className="size-4" />
          {t(locale, 'acl.newContent')}
        </a>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Icon name="book-open" className="size-6" />}
          title={t(locale, 'acl.empty')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>{t(locale, 'acl.colTitle')}</TableHead>
                <TableHead>{t(locale, 'acl.colType')}</TableHead>
                <TableHead>{t(locale, 'acl.colStatus')}</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.slug}
                  id={domId(item.slug)}
                  className={cn('scroll-mt-24', highlightSlug === item.slug && 'bg-accent/15')}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.slug}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.type}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>
                      {statusLabel(locale, item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={localizedPath(
                        locale,
                        `/admin/content/${encodeURIComponent(item.slug)}/edit`,
                      )}
                      onClick={() => recordSelect({ slug: item.slug, title: item.title })}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      <Icon name="pencil" className="size-4" />
                      {t(locale, 'acl.edit')}
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
