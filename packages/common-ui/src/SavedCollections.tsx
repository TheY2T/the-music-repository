import { type Locale, localizedPath, t } from '@TheY2T/tmr-i18n';
import {
  Badge,
  buttonVariants,
  CardGrid,
  cn,
  EmptyState,
  Icon,
  MediaCard,
  PaginationBar,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  usePagination,
} from '@TheY2T/tmr-ui';
import { listMyCollections, listSavedCollections } from '@TheY2T/tmr-web-acl/collections-api';
import type { CollectionSummary } from '@TheY2T/tmr-web-acl/dto';
import { useEffect, useState } from 'react';

function Grid({
  collections,
  locale,
  emptyLabel,
  showVisibility,
  showEdit,
}: {
  collections: CollectionSummary[];
  locale: Locale;
  emptyLabel: string;
  showVisibility?: boolean;
  showEdit?: boolean;
}) {
  const pg = usePagination(collections, { initialPageSize: 25 });

  if (!collections.length) {
    return <EmptyState icon={<Icon name="bookmark" className="size-6" />} title={emptyLabel} />;
  }
  return (
    <div className="space-y-4">
      <CardGrid>
        {pg.pageItems.map((c) => (
          <li key={c.slug} className="space-y-2">
            <MediaCard
              title={c.title}
              href={localizedPath(locale, `/collections/${c.slug}`)}
              summary={c.summary ?? undefined}
              typeLabel={c.kind}
              difficultyLabel={`${c.itemCount} ${t(locale, c.itemCount === 1 ? 'collections.itemOne' : 'collections.itemOther')}`}
              seed={c.slug}
              badgeSlot={
                showVisibility && c.visibility === 'private' ? (
                  <Badge variant="secondary">{t(locale, 'collections.privateBadge')}</Badge>
                ) : undefined
              }
            />
            {showEdit ? (
              <a
                href={localizedPath(locale, `/me/collections/${c.slug}/edit`)}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
              >
                <Icon name="pencil" className="size-4" />
                {t(locale, 'ucoll.edit')}
              </a>
            ) : null}
          </li>
        ))}
      </CardGrid>
      <PaginationBar
        page={pg.page}
        pageCount={pg.pageCount}
        pageSize={pg.pageSize}
        pageSizes={pg.pageSizes}
        rangeFrom={pg.rangeFrom}
        rangeTo={pg.rangeTo}
        total={pg.total}
        onPageChange={pg.setPage}
        onPageSizeChange={pg.setPageSize}
        perPageLabel={t(locale, 'common.perPage')}
        showingLabel={t(locale, 'common.showing', {
          from: pg.rangeFrom,
          to: pg.rangeTo,
          total: pg.total,
        })}
        prevLabel={t(locale, 'common.prev')}
        nextLabel={t(locale, 'common.next')}
      />
    </div>
  );
}

export default function SavedCollections({
  locale,
  canCreate,
}: {
  locale: Locale;
  canCreate: boolean;
}) {
  const [saved, setSaved] = useState<CollectionSummary[] | null>(null);
  const [mine, setMine] = useState<CollectionSummary[] | null>(null);

  useEffect(() => {
    listSavedCollections().then(setSaved);
    listMyCollections().then(setMine);
  }, []);

  return (
    <Tabs defaultValue="saved" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="saved">{t(locale, 'collections.savedTab')}</TabsTrigger>
          <TabsTrigger value="mine">{t(locale, 'collections.myCollectionsTab')}</TabsTrigger>
        </TabsList>
        {canCreate ? (
          <a
            href={localizedPath(locale, '/me/collections/new')}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            <Icon name="plus" className="size-4" />
            {t(locale, 'collections.createCta')}
          </a>
        ) : null}
      </div>

      <TabsContent value="saved">
        {saved === null ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Grid
            collections={saved}
            locale={locale}
            emptyLabel={t(locale, 'collections.savedEmpty')}
          />
        )}
      </TabsContent>

      <TabsContent value="mine">
        {mine === null ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <Grid
            collections={mine}
            locale={locale}
            emptyLabel={t(locale, 'collections.myEmpty')}
            showVisibility
            showEdit
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
