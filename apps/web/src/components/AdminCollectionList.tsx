import type { CollectionSummary } from '@TheY2T/tmr-api-client';
import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
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
import { collectionsAdminApi } from '@/lib/admin-api';
import { useBrowseHistory } from '@/lib/browse-history';

export default function AdminCollectionList({ locale }: { locale: Locale }) {
  const [items, setItems] = useState<CollectionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    collectionsAdminApi
      .list()
      .then((result) => setItems(result.items))
      .catch((e: Error) => setError(e.message));
  }, []);

  // Scroll to + highlight the row the editor just came back from (no filters here, so no state).
  const { highlightSlug, domId, recordSelect } = useBrowseHistory({
    namespace: 'admin-collections',
    itemSlugs: items?.map((c) => c.slug) ?? [],
    ready: items != null,
  });

  if (error) {
    return <p className="text-sm text-destructive">{t(locale, 'acoll.loadError', { error })}</p>;
  }
  if (!items) {
    return <p className="text-sm text-muted-foreground">{t(locale, 'acoll.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a
          href={localizedPath(locale, '/admin/collections/new')}
          className={cn(buttonVariants({ size: 'sm' }))}
        >
          <Icon name="plus" className="size-4" />
          {t(locale, 'acoll.newCollection')}
        </a>
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<Icon name="list-music" className="size-6" />}
          title={t(locale, 'acoll.empty')}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>{t(locale, 'acoll.colTitle')}</TableHead>
                <TableHead>{t(locale, 'acoll.colKind')}</TableHead>
                <TableHead>{t(locale, 'acoll.colItems')}</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((collection) => (
                <TableRow
                  key={collection.slug}
                  id={domId(collection.slug)}
                  className={cn(
                    'scroll-mt-24',
                    highlightSlug === collection.slug && 'bg-accent/15',
                  )}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{collection.title}</div>
                    <div className="text-xs text-muted-foreground">{collection.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{collection.kind}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {collection.itemCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={localizedPath(
                        locale,
                        `/admin/collections/${encodeURIComponent(collection.slug)}/edit`,
                      )}
                      onClick={() =>
                        recordSelect({ slug: collection.slug, title: collection.title })
                      }
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      <Icon name="pencil" className="size-4" />
                      {t(locale, 'acoll.edit')}
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
